import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequestEntity } from '../../db/friendship.entity';
import { UserEntity } from '../../db/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(FriendRequestEntity)
    private readonly friendRepo: Repository<FriendRequestEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async isFriend(usernameA: string, usernameB: string): Promise<boolean> {
    // Use a single query with JOINs instead of separate lookups
    const friendship = await this.friendRepo
      .createQueryBuilder('fr')
      .innerJoin('users', 'ua', 'fr.from_user = ua.id')
      .innerJoin('users', 'ub', 'fr.to_user = ub.id')
      .where('(ua.username = :usernameA AND ub.username = :usernameB)', { usernameA, usernameB })
      .orWhere('(ua.username = :usernameB AND ub.username = :usernameA)', { usernameA, usernameB })
      .andWhere('fr.status = :status', { status: 'accepted' })
      .getOne();

    return !!friendship;
  }

  // async isFriend(userIdA: number, usernameB: string): Promise<boolean> {
  //   // TODO: join table to reduce queries
  //   try {
  //     const userB = await this.userRepo.findOne({
  //       where: { username: usernameB },
  //       select: ['id'],
  //     });

  //     if (!userB) {
  //       return false;
  //     }

  //     const friendRequest = await this.friendRepo.findOne({
  //       where: [
  //         { from_user: userIdA, to_user: userB.id, status: 'accepted' },
  //         { from_user: userB.id, to_user: userIdA, status: 'accepted' },
  //       ],
  //     });

  //     return !!friendRequest;
  //   } catch (error) {
  //     console.error('Error checking friendship status:', error);
  //     return false;
  //   }
  // }
}
