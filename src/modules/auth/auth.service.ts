import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../db/user.entity';
import { CreateUserDto } from '../../dto/user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const userFromDb = await this.usersService.findOneByUsername(username);
    if (!userFromDb) {
      return null;
    }
    const valid = await bcrypt.compare(password, userFromDb.password);
    if (valid) {
      const { id, username } = userFromDb;
      return { id, username };
    }
    return null;
  }

  async register(user: CreateUserDto) {
    const existingUsername = await this.usersService.findOneByUsername(user.username);
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.usersService.findOneByEmail(user.email);
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser: Partial<UserEntity> = {
      ...user,
      password: hashedPassword,
    };

    const createdUser = await this.usersService.create(newUser as UserEntity);

    const token = this.jwtService.sign({ id: createdUser.id, username: createdUser.username });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = createdUser;
    return { ...result, token };
  }

  async login(user: any) {
    const payload = { username: user.username, id: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
