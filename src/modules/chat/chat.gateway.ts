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
import { SocketClient } from 'src/types';
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
  identity(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const isFriend = this.chatService.isFriend(data.user.userId, data.userTo);
    if (!isFriend) {
      return;
    }

    console.log('directMessage', data);
    client.broadcast.emit('directMessage', {
      content: data.content,
      user: { id: data.userId, name: client.data.user.username },
    });
    return data;
  }

  /*==================================================================
                          SOCKET EVENTS
  ==================================================================*/

  sendFriendRequest(from_username: string, to_username: string) {
    const toClient = this.clients.find((client) => client.username === to_username);
    if (toClient) {
      // this.server.to(toClient.clientId).emit('friendRequest', {
      //   from_username,
      // });
      this.server.to(toClient.clientId).emit('message', {
        content: `${from_username} sent you a friend request`,
        user: { id: from_username, name: from_username },
      });
    }
  }
}
