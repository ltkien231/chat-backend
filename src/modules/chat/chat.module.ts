import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { FriendModule } from '../friend/friend.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequestEntity } from '../../db/friendship.entity';
import { UserEntity } from '../../db/user.entity';
import { ChatService } from './chat.service';
import { RedisIoAdapter } from '../../adapters/redis-io.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequestEntity, UserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecret'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    forwardRef(() => FriendModule),
  ],
  providers: [ChatGateway, ChatService, RedisIoAdapter],
  exports: [ChatGateway],
})
export class ChatModule {}
