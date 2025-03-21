import { Test, TestingModule } from '@nestjs/testing';
import { reduce } from 'rxjs/operators';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { FriendService } from '../friend/friend.service';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  const mockFriendService = {
    isFriend: jest.fn(),
  };

  const mockChatService = {
    isFriend: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: FriendService,
          useValue: mockFriendService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('findAll', () => {
    it('should return 3 numbers', (done) => {
      gateway
        .findAll({})
        .pipe(reduce((acc, item) => [...acc, item], []))
        .subscribe((results) => {
          expect(results.length).toBe(3);
          results.forEach((result, index) => expect(result.data).toBe(index + 1));
          done();
        });
    });
  });

  describe('identity', () => {
    it('should return the same number has what was sent', async () => {});
  });
});
