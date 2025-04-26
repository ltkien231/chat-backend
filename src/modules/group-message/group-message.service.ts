import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMessageEntity } from '../../db/group_message.entity';
import { GroupUserEntity } from 'src/db/group_user.entity';

@Injectable()
export class GroupMessageService {
  constructor(
    @InjectRepository(GroupMessageEntity)
    private readonly repo: Repository<GroupMessageEntity>,

    @InjectRepository(GroupUserEntity)
    private readonly groupUserRepo: Repository<GroupUserEntity>,
  ) {}

  async saveMessage(message: Partial<GroupMessageEntity>): Promise<GroupMessageEntity> {
    return this.repo.save(message);
  }

  async getMessagesByGroupId(
    userId: number,
    groupId: number,
    page: number,
    limit: number,
  ): Promise<GroupMessageEntity[]> {
    const groupUser = await this.groupUserRepo.findOne({ where: { user_id: userId, group_id: groupId } });
    if (!groupUser) {
      throw new BadRequestException('User is not a member of the group');
    }
    return this.repo.find({
      where: { groupId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
