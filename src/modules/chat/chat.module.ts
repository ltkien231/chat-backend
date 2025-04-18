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
import { EventsModule } from '../../services/events/events.module';
import { GroupService } from '../group/group.service';
import { GroupModule } from '../group/group.module';
import { GroupEntity } from 'src/db/group.entity';
import { GroupUserEntity } from 'src/db/group_user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequestEntity, UserEntity, GroupEntity, GroupUserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecret'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    GroupModule,
    forwardRef(() => FriendModule),
    EventsModule,
  ],
  providers: [ChatGateway, ChatService, RedisIoAdapter, GroupService],
  exports: [ChatGateway],
})
export class ChatModule {}
