import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { SocketClient } from '../../types';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
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
    console.log('Websocket Server Initialized');
  }

  async handleConnection(client: Socket) {
    const { sockets } = this.server.sockets;

    try {
      const token = client.handshake.auth.token; // Get token from client

      const payload = this.jwtService.verify(token);
      client.data.user = {
        userId: payload.sub,
        username: payload.username,
      };

      console.log('User authenticated Websocket:', payload, client.id);
      console.debug(`Number of connected clients: ${sockets.size}`);
      this.clients.push({
        userId: payload.sub,
        username: payload.username,
        clientId: client.id,
      });
    } catch (error) {
      console.debug('Websocket connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    this.clients = this.clients.filter((c) => c.clientId !== client.id);
  }

  /*==================================================================
                          SOCKET EVENTS
  ==================================================================*/

  @SubscribeMessage('events')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    console.log('events', data);
    return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })));
  }

  @SubscribeMessage('directMessage')
  async handleDirectMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('directMessage', data);
    const toClient = this.clients.find((client) => client.username === data.toUser);
    if (!toClient) {
      // TODO: toUser offline, should send notification to toUser
      console.log('toUser offline');
      return data;
    }

    const isFriend = await this.chatService.isFriend(client.data.user.userId, toClient.userId);
    if (!isFriend) {
      console.log('users not friend');
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

    this.server.to(toClient.clientId).emit('directMessage', {
      content: data.content,
      fromUser: client.data.user.username,
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
