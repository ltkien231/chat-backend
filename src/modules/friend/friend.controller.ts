import { Body, Controller, Post, Get, Request, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { AcceptFriendRequestDto, FriendRequestDto } from 'src/dto/friend.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiResponse } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import { FriendRequestEntity } from 'src/db/friendship.entity';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private friendService: FriendService) {}

  @Post('requests/request')
  @ApiOperation({ summary: 'Send a friend request to a user' })
  @ApiResponse({ status: 201, description: 'Friend request sent successfully' })
  async request(@Request() req, @Body() friendReq: FriendRequestDto) {
    return this.friendService.request(req.user.id, req.user.username, friendReq.toUsername);
  }

  @Get('requests/incoming')
  @ApiOperation({ summary: 'Get incoming friend requests' })
  @ApiResponse({
    status: 200,
    description: 'Incoming friend requests retrieved successfully',
    type: FriendRequestEntity,
    isArray: true,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getIncomingRequests(@Request() req) {
    return this.friendService.getIncomingRequests(req.user.id);
  }

  @Get('requests/outgoing')
  @ApiOperation({ summary: 'Get outgoing friend requests' })
  @ApiResponse({
    status: 200,
    description: 'Outgoing friend requests retrieved successfully',
    type: FriendRequestEntity,
    isArray: true,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getOutgoingRequests(@Request() req) {
    return this.friendService.getOutgoingRequests(req.user.id);
  }

  @Post('requests/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async accept(@Request() req, @Body() body: AcceptFriendRequestDto) {
    return this.friendService.acceptRequest(req.user.id, body.requestId);
  }
}
