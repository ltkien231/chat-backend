import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { DirectMessage, GroupMessage, SocketClient } from '../../types';
import { ChatService } from './chat.service';
import { OnModuleInit } from '@nestjs/common';
import { RedisEventService } from '../../services/events/redis-event.service';
import { FRIEND_REQUEST_CHANNEL } from '../../common/constant';
import { GroupService } from '../group/group.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io/',
  serveClient: false,
  transports: ['polling', 'websocket'],
  namespace: '/',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private clients: SocketClient[] = [];
  private static readonly FRIEND_REQUEST_CHANNEL = FRIEND_REQUEST_CHANNEL;
  private static readonly GROUP_ROOM_PREFIX = 'group:';
  private static readonly GROUP_MEMBERSHIP_CHANNEL = 'group:membership';

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly groupService: GroupService,
    private readonly eventService: RedisEventService,
  ) {}

  private static toRoomId(groupId: number): string {
    return `${ChatGateway.GROUP_ROOM_PREFIX}${groupId}`;
  }

  async onModuleInit() {
    // Subscribe to friend request events
    await this.eventService.subscribe(ChatGateway.FRIEND_REQUEST_CHANNEL, this.handleFriendRequestEvent.bind(this));

    // Subscribe to group membership events
    await this.eventService.subscribe(ChatGateway.GROUP_MEMBERSHIP_CHANNEL, this.handleGroupMembershipEvent.bind(this));
  }

  afterInit() {
    console.log('WebSocket Server Initialized');
    console.log('WebSocket Gateway path:', '/socket.io/');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token; // Get token from client

      if (!token) {
        console.error('No token provided for client:', client.id);
        client.disconnect();
        return;
      }

      try {
        const payload = this.jwtService.verify(token);
        client.data.user = {
          userId: payload.id,
          username: payload.username,
        };

        console.log('User authenticated Websocket:', payload, client.id);
        this.clients.push({
          userId: payload.id,
          username: payload.username,
          clientId: client.id,
        });

        // Join user to their group rooms
        await this.joinUserToGroupRooms(client, payload.id);

        // Send confirmation to client
        client.emit('connectionConfirmed', {
          status: 'connected',
          userId: payload.id,
          username: payload.username,
        });
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError.message);
        client.disconnect();
        return;
      }
    } catch (error) {
      console.error('Websocket connection error:', error.message, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.clients = this.clients.filter((c) => c.clientId !== client.id);
    console.log(`Client disconnected: ${client.id}. Remaining connected clients: ${this.clients.length}`);
  }

  /*==================================================================
                          SOCKET EVENTS
  ==================================================================*/

  @SubscribeMessage('directMessage')
  async handleDirectMessage(@MessageBody() data: DirectMessage, @ConnectedSocket() client: Socket) {
    console.log('Received directMessage event:', data);
    console.log('From client:', client.id, 'User:', client.data?.user);

    const isFriend = await this.chatService.isFriend(client.data.user.username, data.toUser);
    if (!isFriend) {
      console.log(`Users not friends: ${client.data.user.username} and ${data.toUser}`);
      client.emit('response', {
        msg_topic: 'directMessage',
        msg_type: 'error',
        msg: {
          error_type: 'not_friend',
          error_msg: 'You are not friends with this user',
          toUser: data.toUser,
        },
      });
      return data;
    }

    const toClient = this.clients.find((c) => c.username === data.toUser);
    if (!toClient) {
      console.log(`Target user '${data.toUser}' is offline or not found`);
      client.emit('response', {
        msg_topic: 'directMessage',
        msg_type: 'error',
        msg: {
          error_type: 'user_offline',
          error_msg: 'User is offline or not found',
        },
      });
      return data;
    }

    console.log(`Sending message to ${toClient.username} (${toClient.clientId})`);
    this.server.to(toClient.clientId).emit('directMessage', {
      content: data.content,
      fromUser: client.data.user.username,
    });

    // Confirm message was sent
    client.emit('messageSent', {
      status: 'success',
      to: data.toUser,
      content: data.content,
    });

    return data;
  }

  @SubscribeMessage('groupMessage')
  async handleGroupMessage(@MessageBody() data: GroupMessage, @ConnectedSocket() client: Socket) {
    console.log('Received groupMessage event:', JSON.stringify(data));
    console.log('From client:', client.id, 'User:', JSON.stringify(client.data?.user));

    if (!client.data?.user) {
      console.error('No user data found for client:', client.id);
      client.emit('response', {
        msg_topic: 'groupMessage',
        msg_type: 'error',
        msg: {
          error_type: 'authentication',
          error_msg: 'User not authenticated',
        },
      });
      return;
    }

    const { groupId, content } = data;

    try {
      // Check if user is a member of the group
      const isMember = await this.chatService.isGroupMember(groupId, client.data.user.userId);

      console.log(
        `User ${client.data.user.username} (${client.data.user.userId}) 
        is${isMember ? '' : ' NOT'} a member of group ${groupId}`,
      );

      if (!isMember) {
        client.emit('response', {
          msg_topic: 'groupMessage',
          msg_type: 'error',
          msg: {
            error_type: 'not_member',
            error_msg: 'You are not a member of this group',
            groupId,
          },
        });
        return;
      }

      // Get the room ID for this group
      const roomId = ChatGateway.toRoomId(groupId);
      console.log(`Broadcasting group message to room ${roomId}`);

      // Log the rooms this client is in
      const clientRooms = Object.keys(client.rooms || {});
      console.log(`Client ${client.data.user.username} rooms: ${JSON.stringify(clientRooms)}`);

      // Log all sockets in this room
      const socketsInRoom = await this.server.in(roomId).fetchSockets();
      console.log(`Clients in room ${roomId}: ${socketsInRoom.length}`);
      socketsInRoom.forEach((socket) => {
        console.log(`Socket in room ${roomId}: ${socket.id}, user: ${JSON.stringify(socket.data?.user)}`);
      });

      // Create message object
      const messageObj = {
        groupId,
        content,
        fromUser: client.data.user.username,
        fromUserId: client.data.user.userId,
        timestamp: new Date(),
      };

      console.log(`Emitting group message: ${JSON.stringify(messageObj)}`);

      // Broadcast the message to the group room including the sender
      this.server.to(roomId).emit('groupMessage', messageObj);

      // Also send confirmation to the sender
      client.emit('messageSent', {
        status: 'success',
        toGroup: groupId,
        content: content,
      });

      console.log(`Group message sent to room ${roomId}`);
    } catch (error) {
      console.error('Error handling group message:', error);
      console.error(error.stack);
      client.emit('response', {
        msg_topic: 'groupMessage',
        msg_type: 'error',
        msg: {
          error_type: 'server_error',
          error_msg: 'Failed to process group message',
        },
      });
    }
  }

  /**
   * When a user connects and authenticates, join them to all their group rooms
   */
  async joinUserToGroupRooms(client: Socket, userId: number) {
    try {
      // Get all groups the user belongs to
      const userGroups = await this.groupService.getUserGroups(userId);
      console.log(`User ${client.data.user.username} (${userId}) has ${userGroups.length} groups. Joining rooms...`);

      const roomIds = userGroups.map((group) => ChatGateway.toRoomId(group.id));
      await client.join(roomIds);
      console.log(`User ${client.data.user.username} joined room ${roomIds}`);
      const socketsInRoom = await this.server.in(roomIds[0]).fetchSockets();
      console.log(`Clients in room ${roomIds[0]}: ${socketsInRoom.length}`);
    } catch (error) {
      console.error(`Failed to join user to group rooms: ${error.message}`);
    }
  }

  // Add method to handle joining/leaving group rooms when group membership changes
  async handleGroupMembershipChange(groupId: number, userId: number, isJoining: boolean) {
    const roomId = ChatGateway.toRoomId(groupId);

    // Find all socket clients for this user
    const userClients = this.clients.filter((client) => client.userId === userId);

    for (const userClient of userClients) {
      const clientSocket = this.server.sockets.sockets.get(userClient.clientId);
      if (clientSocket) {
        if (isJoining) {
          await clientSocket.join(roomId);
          console.log(`User ${userClient.username} joined room ${roomId}`);
        } else {
          await clientSocket.leave(roomId);
          console.log(`User ${userClient.username} left room ${roomId}`);
        }
      }
    }
  }

  /*==================================================================
                          HANDLE REDIS EVENTS 
  ==================================================================*/

  sendFriendRequest(fromUsername: string, toUsername: string) {
    const toClient = this.clients.find((client) => client.username === toUsername);
    if (toClient) {
      this.server.to(toClient.clientId).emit('friendRequest', {
        content: `${fromUsername} sent you a friend request`,
        fromUser: { id: fromUsername, name: fromUsername },
      });
    }
  }

  // Handle friend request events from Redis
  private handleFriendRequestEvent(data: { fromUsername: string; toUsername: string }) {
    const { fromUsername, toUsername } = data;
    console.log('SERVER: Received friend request event:', data);
    // Find the target client and send the friend request notification
    const toClient = this.clients.find((client) => client.username === toUsername);
    if (toClient) {
      this.server.to(toClient.clientId).emit('friendRequest', {
        content: `${fromUsername} sent you a friend request`,
        fromUser: { username: fromUsername },
      });
    }
  }

  /**
   * Handle group membership changes from Redis events
   */
  private async handleGroupMembershipEvent(data: { groupId: number; userId: number; isJoining: boolean }) {
    const { groupId, userId, isJoining } = data;
    console.log(`Group membership change: User ${userId} ${isJoining ? 'joined' : 'left'} group ${groupId}`);

    // Update socket room membership
    await this.handleGroupMembershipChange(groupId, userId, isJoining);

    // Notify group members about the change
    const groupRoomId = ChatGateway.toRoomId(groupId);

    // Find the username of the user who joined/left
    const userClient = this.clients.find((client) => client.userId === userId);
    const username = userClient?.username || `User ${userId}`;

    // Emit to the group room
    this.server.to(groupRoomId).emit('groupUpdate', {
      groupId,
      type: isJoining ? 'memberJoined' : 'memberLeft',
      username,
      timestamp: new Date(),
    });
  }
}
