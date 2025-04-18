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
import { DirectMessageEntity } from 'src/db/direct_message.entity';
import { DirectMessageModule } from '../direct-message/direct-message.module';
import { DirectMessageService } from '../direct-message/direct-message.service';
import { UserService } from '../user/user.service';
import { GroupMessageModule } from '../group-message/group-message.module';
import { GroupMessageService } from '../group-message/group-message.service';
import { GroupMessageEntity } from 'src/db/group_message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FriendRequestEntity,
      UserEntity,
      GroupEntity,
      GroupUserEntity,
      DirectMessageEntity,
      GroupMessageEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecret'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    DirectMessageModule,
    GroupMessageModule,
    forwardRef(() => FriendModule),
    forwardRef(() => GroupModule),
    EventsModule,
  ],
  providers: [
    ChatGateway,
    ChatService,
    RedisIoAdapter,
    GroupService,
    DirectMessageService,
    UserService,
    GroupMessageService,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}
