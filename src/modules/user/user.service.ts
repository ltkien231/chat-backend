import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../db/user.entity';

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
}
