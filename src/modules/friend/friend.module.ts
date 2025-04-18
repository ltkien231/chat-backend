import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequestEntity } from '../../db/friendship.entity';
import { UserModule } from '../user/user.module';
import { EventsModule } from '../../services/events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([FriendRequestEntity]), UserModule, EventsModule],
  providers: [FriendService],
  controllers: [FriendController],
  exports: [FriendService],
})
export class FriendModule {}
