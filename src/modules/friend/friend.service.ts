import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class FriendService {
  constructor(
    private readonly userService: UserService,
    private chatGateway: ChatGateway,
  ) {}

  async request(fromUsername: string, toUsername: string) {
    if (fromUsername === toUsername) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }
    const toUser = await this.userService.findOneByUsername(toUsername);
    if (!toUser) {
      throw new BadRequestException('User not found');
    }
    this.chatGateway.sendFriendRequest(fromUsername, toUsername);
  }
}
