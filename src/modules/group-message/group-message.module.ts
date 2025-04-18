import { Module } from '@nestjs/common';
import { GroupMessageService } from './group-message.service';
import { GroupMessageController } from './group-message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMessageEntity } from 'src/db/group_message.entity';
import { GroupUserEntity } from 'src/db/group_user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupMessageEntity, GroupUserEntity])],
  providers: [GroupMessageService],
  controllers: [GroupMessageController],
  exports: [GroupMessageService],
})
export class GroupMessageModule {}
