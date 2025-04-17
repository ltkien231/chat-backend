import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupEntity } from '../../db/group.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './group.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GroupEntity])],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
