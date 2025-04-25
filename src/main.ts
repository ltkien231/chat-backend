import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RedisIoAdapter } from './adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('v1');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const configService = app.get(ConfigService);

  // Initialize Redis adapter with app instance
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  // Setup CORS for REST endpoints
  app.enableCors({
    origin: [
      'http://localhost:3001', 
      'http://localhost:3000',
      'https://chatchick.azurewebsites.net',
      process.env.FRONTEND_URL, // Add environment variable support
    ].filter(Boolean), // Filter out undefined values
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Enable credentials
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const config = new DocumentBuilder()
    .setTitle('Online Chat API')
    .setDescription('Support for real-time chat')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);

  const port = configService.get('PORT') || 8080;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
  console.log(`Socket.IO server available at http://localhost:${port}/socket.io/`);
}
bootstrap();
