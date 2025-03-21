import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendRequestEntity } from '../../db/friendship.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendController } from './friend.controller';
import { UserModule } from '../user/user.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [TypeOrmModule.forFeature([FriendRequestEntity]), UserModule, ChatModule],
  controllers: [FriendController],
  providers: [FriendService],
  exports: [FriendService],
})
export class FriendModule {}
