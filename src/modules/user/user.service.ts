import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/db/user/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async create(user: UserEntity): Promise<UserEntity> {
    await this.repo.save(user);
    return user;
  }

  async findOne(username: string): Promise<UserEntity | undefined> {
    return this.repo.findOneBy({ username });
  }
}
