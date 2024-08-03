// socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from './redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: [process.env.CLIENT, process.env.SOCKET, process.env.DB],
    credentials: true,
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private readonly redisService: RedisService) {}

  afterInit(server: Server) {
    server.adapter(this.redisService.getAdapter());
    console.log('✅ Redis adapter initialized successfully');
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }
}
