import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from '../../db/group.entity';
import { GroupUserEntity } from '../../db/group_user.entity';
import { UserEntity } from '../../db/user.entity';
import { GroupResponseDto } from '../../dto/group.dto';
import { DataSource, In, Repository } from 'typeorm';
import { RedisEventService } from '../../services/events/redis-event.service';

@Injectable()
export class GroupService {
  private static readonly GROUP_MEMBERSHIP_CHANNEL = 'group:membership';

  constructor(
    @InjectRepository(GroupEntity)
    private readonly repo: Repository<GroupEntity>,

    @InjectRepository(GroupUserEntity)
    private readonly memberRepo: Repository<GroupUserEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    private readonly dataSource: DataSource,
    private readonly eventService: RedisEventService,
  ) {}

  async createGroup(name: string, owner: number, member_usernames: string[]): Promise<any> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.connect();

    const memberIds = await queryRunner.manager.find(UserEntity, {
      where: { username: In(member_usernames) },
      select: ['id'],
    });

    await queryRunner.startTransaction();
    try {
      const group = queryRunner.manager.create(GroupEntity, { name, owner });
      await queryRunner.manager.save(group);

      const groupMembers = queryRunner.manager.create(
        GroupUserEntity,
        memberIds.map((member) => ({
          group_id: group.id,
          user_id: member.id,
        })),
      );
      await queryRunner.manager.save(groupMembers);

      await queryRunner.commitTransaction();
      return group;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error('Create group failed: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async getUserGroups(userId: number): Promise<GroupResponseDto[]> {
    const groups = await this.repo.findBy({
      owner: userId,
    });
    if (!groups) {
      return [];
    }
    const groupIds = groups.map((g) => g.id);
    return this.getGroups(groupIds);
  }

  async getGroups(groupIds: number[]): Promise<GroupResponseDto[]> {
    const res = await this.dataSource.query(
      `SELECT g.owner, g.id, g.name, u.id as user_id, u.username FROM group_users gu
       LEFT JOIN users u ON gu.user_id = u.id
       LEFT JOIN chat_groups g ON gu.group_id = g.id
       WHERE gu.group_id IN (?)`,
      [groupIds],
    );
    const groups = Object.values(
      res.reduce(
        (acc, curr) => {
          if (!acc[curr.id]) {
            acc[curr.id] = { id: curr.id, name: curr.name, owner: curr.owner, members: [] };
          }
          acc[curr.id].members.push({ userId: curr.user_id, username: curr.username });
          return acc;
        },
        {} as Record<number, { age: number; members: typeof res }>,
      ),
    );
    return groups as GroupResponseDto[];
  }

  async getGroup(groupId: number): Promise<GroupResponseDto> {
    const group = await this.dataSource.query(
      `SELECT g.owner, g.name, u.id, u.username FROM group_users gu
       LEFT JOIN users u ON gu.user_id = u.id
       LEFT JOIN chat_groups g ON gu.group_id = g.id
       WHERE gu.group_id = ?`,
      [groupId],
    );

    if (!group) {
      throw new NotFoundException('Request not found');
    }
    const members = group.map((member) => ({
      userId: member.id,
      username: member.username,
    }));

    return {
      id: groupId,
      name: group[0].name,
      owner: group[0].owner,
      members,
    };
  }

  async addMembers(owner: number, groupId: number, member_usernames: string[]): Promise<any> {
    const group = await this.getGroup(groupId);
    if (group.owner !== owner) {
      throw new BadRequestException('You are not the owner of this group');
    }

    const newMemberUsernames = member_usernames.filter(
      (username) => !group.members.find((member) => member.username === username),
    );

    const users = await this.userRepo.find({
      where: { username: In(newMemberUsernames) },
      select: ['id', 'username'],
    });

    const newMembers = users.map(
      (user) =>
        ({
          group_id: groupId,
          user_id: user.id,
        }) as Partial<GroupUserEntity>,
    );

    await this.memberRepo.insert(newMembers);

    // Notify chat gateway about the new members via Redis
    for (const user of users) {
      await this.notifyGroupMembershipChange(groupId, user.id, true);
    }

    return {
      message: 'Members added successfully',
    };
  }

  async removeMembers(owner: number, groupId: number, member_usernames: string[]): Promise<any> {
    const group = await this.getGroup(groupId);
    if (group.owner !== owner) {
      throw new BadRequestException('You are not the owner of this group');
    }

    const users = await this.userRepo.find({
      where: { username: In(member_usernames) },
      select: ['id', 'username'],
    });

    const userIds = users.map((user) => user.id);

    if (userIds.length > 0) {
      await this.memberRepo.delete({
        group_id: groupId,
        user_id: In(userIds),
      });

      // Notify chat gateway about removed members via Redis
      for (const userId of userIds) {
        await this.notifyGroupMembershipChange(groupId, userId, false);
      }
    }

    return {
      message: 'Members removed successfully',
    };
  }

  /**
   * Notify other services (like ChatGateway) about group membership changes
   */
  private async notifyGroupMembershipChange(groupId: number, userId: number, isJoining: boolean): Promise<void> {
    try {
      await this.eventService.publish(GroupService.GROUP_MEMBERSHIP_CHANNEL, {
        groupId,
        userId,
        isJoining,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to notify group membership change:', error);
    }
  }
}
