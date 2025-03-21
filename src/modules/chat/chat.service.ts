import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequestEntity } from '../../db/friendship.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(FriendRequestEntity)
    private readonly friendRepo: Repository<FriendRequestEntity>,
  ) {}

  async isFriend(userA: number, userB: number) {
    const friendRequest = await this.friendRepo.findOne({
      where: [
        { from_user: userA, to_user: userB, status: 'accepted' },
        { from_user: userB, to_user: userA, status: 'accepted' },
      ],
    });
    return friendRequest ? true : false;
  }
}
