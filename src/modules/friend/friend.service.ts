import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { FriendRequestEntity } from '../../db/friendship.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisEventService } from '../../services/events/redis-event.service';
import { FRIEND_REQUEST_CHANNEL } from '../../common/constant';

@Injectable()
export class FriendService {
  private static readonly FRIEND_REQUEST_CHANNEL = FRIEND_REQUEST_CHANNEL;

  constructor(
    @InjectRepository(FriendRequestEntity)
    private readonly repo: Repository<FriendRequestEntity>,
    private readonly userService: UserService,
    private readonly eventService: RedisEventService,
  ) {}

  async request(fromUserId: number, fromUsername: string, toUsername: string) {
    const toUser = await this.userService.findOneByUsername(toUsername);
    if (!toUser) {
      throw new BadRequestException('User not found');
    }
    if (fromUserId === toUser.id) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }

    const requestExists = await this.repo.findOne({
      where: {
        from_user: fromUserId,
        to_user: toUser.id,
      },
    });
    if (requestExists) {
      if (requestExists.status === 'accepted') {
        throw new BadRequestException('You are already friends');
      }
      throw new BadRequestException('Friend request already sent');
    }

    const friendRequest: Partial<FriendRequestEntity> = {
      from_user: fromUserId,
      to_user: toUser.id,
    };
    await this.repo.save(friendRequest);

    // Publish friend request event instead of directly calling ChatGateway
    await this.eventService.publish(FriendService.FRIEND_REQUEST_CHANNEL, {
      fromUsername,
      toUsername,
    });
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

  async getFriends(userId: number) {
    const requests = await this.repo.find({
      where: [
        { from_user: userId, status: 'accepted' },
        { to_user: userId, status: 'accepted' },
      ],
    });
    const friendIds = requests.map((request) => {
      return request.from_user === userId ? request.to_user : request.from_user;
    });
    const friends = await this.userService.findByIds(friendIds);

    return friends.map((friend) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, createdAt, ...result } = friend;
      return result;
    });
  }
}
