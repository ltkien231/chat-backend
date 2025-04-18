import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../../db/user.entity';
import { UpdateProfileDto } from '../../dto/user.dto';
import { SearchUserQuery } from 'src/types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    return this.repo.save(user);
  }

  async findOneByUsername(username: string): Promise<UserEntity | undefined> {
    return this.repo.findOneBy({ username });
  }

  async findOneByEmail(email: string): Promise<UserEntity | undefined> {
    return this.repo.findOneBy({ email });
  }

  async findOneById(id: number): Promise<UserEntity | undefined> {
    return this.repo.findOneBy({ id });
  }

  async updateProfile(userId: number, newProfile: UpdateProfileDto): Promise<UserEntity | undefined> {
    const user = await this.findOneById(userId);
    if (!user) {
      return undefined;
    }
    Object.assign(user, newProfile);
    return this.repo.save(user);
  }

  async findByIds(ids: number[]): Promise<UserEntity[]> {
    return this.repo.findBy({ id: In(ids) });
  }

  async searchUsers(query: SearchUserQuery): Promise<UserEntity[]> {
    if (query.email && query.username) {
      return this.repo
        .createQueryBuilder('users')
        .where('users.username LIKE :query', { query: `%${query.username}%` })
        .andWhere('users.email LIKE :query', { query: `%${query.email}%` })
        .getMany();
    } else if (query.username) {
      return this.repo
        .createQueryBuilder('users')
        .where('users.username LIKE :query', { query: `%${query.username}%` })
        .getMany();
    } else if (query.email) {
      return this.repo
        .createQueryBuilder('users')
        .where('users.email LIKE :query', { query: `%${query.email}%` })
        .getMany();
    } else {
      return [];
    }
  }
}
