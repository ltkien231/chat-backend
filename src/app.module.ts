import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { FriendModule } from './modules/friend/friend.module';
import { ChatModule } from './modules/chat/chat.module';
import { loadConfig } from './config/';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { ConfigService } from '@nestjs/config';
import { DbConfig } from './types';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const db = configService.get<DbConfig>('database');
        const env = configService.get('env');
        return {
          type: 'mysql',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.dbName,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          // synchronize: true,
          ssl: env === 'production' ? { secureProtocol: 'TLSv1_3_method' } : undefined,
          logging: env !== 'production',
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    FriendModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: 'chat', method: RequestMethod.POST });
  }
}
