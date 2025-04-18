import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectMessageEntity } from '../../db/direct_message.entity';

@Injectable()
export class DirectMessageService {
  constructor(
    @InjectRepository(DirectMessageEntity)
    private readonly directMessageRepo: Repository<DirectMessageEntity>,
  ) {}

  async saveMessage(message: Partial<DirectMessageEntity>): Promise<DirectMessageEntity> {
    return this.directMessageRepo.save(message);
  }

  async getMessagesBetweenUsers(userA: number, userB: number): Promise<DirectMessageEntity[]> {
    return this.directMessageRepo
      .createQueryBuilder('dm')
      .where('(dm.from_user = :userA AND dm.to_user = :userB) OR (dm.from_user = :userB AND dm.to_user = :userA)', {
        userA,
        userB,
      })
      .orderBy('dm.created_at', 'ASC')
      .getMany();
  }
}
