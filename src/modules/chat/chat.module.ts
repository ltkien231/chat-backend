import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { FriendModule } from '../friend/friend.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequestEntity } from 'src/db/friendship.entity';
import { ChatService } from './chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequestEntity]),
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
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway],
})
export class ChatModule {}
