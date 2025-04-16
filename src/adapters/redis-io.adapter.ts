import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { INestApplicationContext, Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const env = this.configService.get('env');
    const redisConfig = this.configService.get('redis');

    try {
      this.logger.log(`Connecting to Redis in ${env} environment`);

      const pubClient =
        env === 'dev' || !redisConfig
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

      await Promise.all([
        pubClient.connect().then(() => this.logger.log('Redis PUB client connected')),
        subClient.connect().then(() => this.logger.log('Redis SUB client connected')),
      ]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Redis adapter created successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
      this.logger.warn('Falling back to default in-memory adapter');
      // We don't set adapterConstructor so it will fall back to default
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    // These are important Socket.IO options to match the frontend client
    const socketOptions: ServerOptions = {
      path: '/socket.io/',
      serveClient: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      ...options,
    };

    this.logger.log(`Creating Socket.IO server with path: ${socketOptions.path}`);

    const server = super.createIOServer(port, socketOptions);

    // Only apply redis adapter if we successfully connected
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('Applied Redis adapter to Socket.IO server');
    } else {
      this.logger.warn('Using default in-memory adapter for Socket.IO server');
    }

    return server;
  }
}
