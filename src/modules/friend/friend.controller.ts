import { BadRequestException, Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { UserService } from '../user/user.service';
import { FriendRequestDto } from 'src/dto/friend.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(
    private friendService: FriendService,
    private userService: UserService,
  ) {}

  @Post('request')
  async request(@Request() req, @Body() friendReq: FriendRequestDto) {
    return this.friendService.request(req.user.username, friendReq.toUsername);
  }

  @Post('accept')
  async accept(@Request() req, @Body() friendReq: FriendRequestDto) {
    const fromUser = await this.userService.findOneByUsername(friendReq.toUsername);
    if (!fromUser) {
      throw new BadRequestException('User not found');
    }
  }
}
