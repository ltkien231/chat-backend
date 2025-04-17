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
import { SocketClient } from '../../types';
import { ChatService } from './chat.service';

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
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: SocketClient[] = [];

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  afterInit() {
    console.log('WebSocket Server Initialized');
    console.log('WebSocket Gateway path:', '/socket.io/');
  }

  async handleConnection(client: Socket) {
    // const sockets = this.server.sockets.sockets;
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
          userId: payload.sub,
          username: payload.username,
        };

        console.log('User authenticated Websocket:', payload, client.id);
        // TODO: check why undefined
        // console.log(`Number of connected clients: ${sockets.size}`);
        this.clients.push({
          userId: payload.sub,
          username: payload.username,
          clientId: client.id,
        });

        // Send confirmation to client
        client.emit('connectionConfirmed', {
          status: 'connected',
          userId: payload.sub,
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
    console.log('Client disconnected:', client.id);
    this.clients = this.clients.filter((c) => c.clientId !== client.id);
    console.log(`Remaining connected clients: ${this.clients.length}`);
  }

  /*==================================================================
                          SOCKET EVENTS
  ==================================================================*/

  @SubscribeMessage('directMessage')
  async handleDirectMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('Received directMessage event:', data);
    console.log('From client:', client.id, 'User:', client.data?.user);

    // Check if user data is available
    if (!client.data?.user) {
      console.error('No user data found for client:', client.id);
      client.emit('response', {
        msg_topic: 'directMessage',
        msg_type: 'error',
        msg: {
          error_type: 'authentication',
          error_msg: 'User not authenticated',
        },
      });
      return;
    }

    const isFriend = await this.chatService.isFriend(client.data.user.userId, data.toUser);
    if (!isFriend) {
      console.log(`Users not friends: ${client.data.user.username} and ${data.toUser}`);
      client.emit('response', {
        msg_topic: 'directMessage',
        msg_type: 'error',
        msg: {
          error_type: 'not_friend',
          error_msg: 'You are not friends with this user',
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
}
