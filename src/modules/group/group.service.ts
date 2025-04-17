import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from 'src/db/group.entity';
import { GroupUserEntity } from 'src/db/group_user.entity';
import { UserEntity } from 'src/db/user.entity';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repo: Repository<GroupEntity>,
    private readonly dataSource: DataSource,
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

  async getMyGroups(userId: number): Promise<any> {
    const groups = await this.repo.findBy({
      owner: userId,
    });
    if (!groups) {
      return [];
    }
    const groupIds = groups.map((g) => g.id);
    return this.getGroupMembers(groupIds);
  }

  async getGroupMembers(groupIds: number[]): Promise<any> {
    const res = await this.dataSource.query(
      `SELECT g.id, g.name, u.id as user_id, u.username FROM group_users gu
       LEFT JOIN users u ON gu.user_id = u.id
       LEFT JOIN chat_groups g ON gu.group_id = g.id
       WHERE gu.group_id IN (?)`,
      [groupIds],
    );
    const groups = Object.values(
      res.reduce(
        (acc, curr) => {
          if (!acc[curr.id]) {
            acc[curr.id] = { id: curr.id, name: curr.name, members: [] };
          }
          acc[curr.id].members.push({ userId: curr.user_id, username: curr.username });
          return acc;
        },
        {} as Record<number, { age: number; members: typeof res }>,
      ),
    );
    return groups;
  }

  async getGroup(groupId: number): Promise<any> {
    const group = await this.dataSource.query(
      `SELECT g.name, u.id, u.username FROM group_users gu
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
      members,
    };
  }
}
