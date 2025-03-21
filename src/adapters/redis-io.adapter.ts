import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(private configService: ConfigService) {
    super();
  }

  async connectToRedis(): Promise<void> {
    const env = this.configService.get('env');
    const redisConfig = this.configService.get('redis');

    const pubClient =
      env === 'dev'
        ? createClient({ url: 'redis://localhost:6379' })
        : createClient({
            url: redisConfig.url,
            password: redisConfig.password,
            socket: {
              tls: true, // Azure Redis requires TLS
              rejectUnauthorized: true,
            },
          });

    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
