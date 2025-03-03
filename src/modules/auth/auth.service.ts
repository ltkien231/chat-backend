import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const userFromDb = await this.usersService.findOne(username);
    const valid = await bcrypt.compare(password, userFromDb.password);
    if (valid) {
      const { id, username } = userFromDb;
      return { id, username };
    }
    return null;
  }

  async signup(user: any) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = { ...user, password: hashedPassword };
    return this.usersService.create(newUser);
  }

  async login(user: any) {
    console.log('user from auth service', user);
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
