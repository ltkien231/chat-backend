import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequestEntity } from '../../db/friendship.entity';
import { UserEntity } from '../../db/user.entity';
import { GroupUserEntity } from '../../db/group_user.entity';
import { GroupEntity } from '../../db/group.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(FriendRequestEntity)
    private readonly friendRepo: Repository<FriendRequestEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(GroupUserEntity)
    private readonly groupUserRepo: Repository<GroupUserEntity>,

    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
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

  /**
   * Check if a user is a member of a specific group
   */
  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    try {
      const membership = await this.groupUserRepo.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
        },
      });

      return !!membership;
    } catch (error) {
      console.error('Error checking group membership:', error);
      return false;
    }
  }
}
