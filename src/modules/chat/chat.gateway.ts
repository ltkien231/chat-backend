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

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly groupService: GroupService,
    private readonly eventService: RedisEventService,
  ) {}

  async onModuleInit() {
    // Subscribe to friend request events
    await this.eventService.subscribe(ChatGateway.FRIEND_REQUEST_CHANNEL, this.handleFriendRequestEvent.bind(this));
  }

  afterInit() {
    console.log('WebSocket Server Initialized');
    console.log('WebSocket Gateway path:', '/socket.io/');
  }

  async handleConnection(client: Socket) {
    console.log('New client connection attempt', client.id);
    console.log('Auth data received:', client.handshake.auth);

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
    console.log('Received groupMessage event:', data);
    console.log('From client:', client.id, 'User:', client.data?.user);

    const group = await this.groupService.getGroup(data.toGroup);

    const toClient = this.clients.filter((c) => group.members.find((member) => member.username === c.username));
    if (toClient.length === 0) {
      console.log(`Target group '${data.toGroup}' is offline or not found`);
      client.emit('response', {
        msg_topic: 'groupMessage',
        msg_type: 'error',
        msg: {
          error_type: 'group_offline',
          error_msg: 'Group is offline or not found',
        },
      });
      return data;
    }
    console.log(`Sending message to group ${data.toGroup}`);
  }

  /*==================================================================
                          FRIEND REQUEST
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
}
