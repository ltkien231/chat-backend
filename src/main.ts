import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { RedisSocketIoAdapter } from './adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const redisIoAdapter = new RedisSocketIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  const port = configService.get('PORT');
  await app.listen(port);
  console.log('App started on port', port);
}
bootstrap();
