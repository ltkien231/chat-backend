import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ChatGateway } from '../chat/chat.gateway';
import { FriendRequestEntity } from 'src/db/friendship.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(FriendRequestEntity)
    private readonly repo: Repository<FriendRequestEntity>,
    private readonly userService: UserService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async request(fromUserId: number, fromUsername: string, toUsername: string) {
    const toUser = await this.userService.findOneByUsername(toUsername);
    if (!toUser) {
      throw new BadRequestException('User not found');
    }
    if (fromUserId === toUser.id) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }

    const friendRequest: Partial<FriendRequestEntity> = {
      from_user: fromUserId,
      to_user: toUser.id,
    };
    await this.repo.save(friendRequest);

    this.chatGateway.sendFriendRequest(fromUsername, toUsername);
  }

  async getIncomingRequests(userId: number) {
    return this.repo.find({
      where: {
        to_user: userId,
        status: 'pending',
      },
    });
  }

  async getOutgoingRequests(userId: number) {
    return this.repo.find({
      where: {
        from_user: userId,
        status: 'pending',
      },
    });
  }

  async acceptRequest(userId: number, requestId: number) {
    const request = await this.repo.findOne({
      where: { id: requestId, to_user: userId, status: 'pending' },
    });
    if (!request) {
      throw new BadRequestException('Request not found');
    }
    request.status = 'accepted';
    await this.repo.save(request);
  }
}
