// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
@UseGuards(LocalAuthGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Request() req) {
    console.log('req.user', req.user);
    return this.authService.login(req.user);
  }

  // @UseGuards(LocalAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return req.logout();
  }
}
