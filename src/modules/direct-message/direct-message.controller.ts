import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DirectMessageService } from './direct-message.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('direct-messages')
export class DirectMessageController {
  constructor(private readonly directMessageService: DirectMessageService) {}

  @Get('')
  @ApiOperation({ summary: 'Get direct messages' })
  @ApiQuery({ name: 'with', required: true, description: 'User ID to get messages with' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of messages per page' })
  async getDirectMessages(
    @Req() req,
    @Query('with') otherUserId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    const messages = await this.directMessageService.getMessagesBetweenUsers(
      userId,
      otherUserId,
      page ?? 1,
      limit ?? 1000,
    );
    return messages;
  }
}
