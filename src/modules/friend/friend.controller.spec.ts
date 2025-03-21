import { Test, TestingModule } from '@nestjs/testing';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';

describe('FriendController', () => {
  let controller: FriendController;

  const mockFriendService = {
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    rejectFriendRequest: jest.fn(),
    getFriends: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendController],
      providers: [
        {
          provide: FriendService,
          useValue: mockFriendService,
        },
      ],
    }).compile();

    controller = module.get<FriendController>(FriendController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
