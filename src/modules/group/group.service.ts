import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from 'src/db/group.entity';
import { UserEntity } from 'src/db/user.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repo: Repository<GroupEntity>,
  ) {}

  async createGroup(name: string, owner: number, member_usernames: string[]): Promise<any> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.connect();

    const members = await queryRunner.manager.find(UserEntity, {
      where: { username: In(member_usernames) },
      select: ['id'],
    });
    console.log('members', members);

    // await queryRunner.startTransaction();
    // try {
    //   const group = queryRunner.manager.create(GroupEntity, { name, owner });
    //   await queryRunner.manager.save(group);

    //   const members = queryRunner.manager.create(Profile, { bio, user });
    //   await queryRunner.manager.save(profile);

    //   await queryRunner.commitTransaction();
    //   return user;
    // } catch (err) {
    //   await queryRunner.rollbackTransaction();
    //   throw new Error('Transaction failed: ' + err.message);
    // } finally {
    //   await queryRunner.release();
    // }
  }
}
