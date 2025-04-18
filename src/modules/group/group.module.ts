import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupEntity } from '../../db/group.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './group.controller';
import { GroupUserEntity } from '../../db/group_user.entity';
import { UserEntity } from '../../db/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupEntity, GroupUserEntity, UserEntity])],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
