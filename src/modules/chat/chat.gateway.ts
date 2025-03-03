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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: string[] = [];

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    console.log('Websocket Server Initialized');
  }

  async handleConnection(client: Socket) {
    const { sockets } = this.server.sockets;

    try {
      const token = client.handshake.auth.token; // Get token from client

      const payload = this.jwtService.verify(token);

      client.data.user = payload; // Store user data in socket

      console.log('User authenticated Websocket:', payload, client.id);
      console.debug(`Number of connected clients: ${sockets.size}`);
      this.clients.push(client.id);
    } catch (error) {
      console.debug('Websocket connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: any) {
    console.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage('events')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    console.log('events', data);
    return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })));
  }

  @SubscribeMessage('identity')
  identity(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('identity', data);
    client.broadcast.emit('message', { content: data.content, user: { id: data.userId, name: 'kien' } });
    return data;
  }
}
