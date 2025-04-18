import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DirectMessageService } from './direct-message.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('direct-messages')
export class DirectMessageController {
  constructor(private readonly directMessageService: DirectMessageService) {}

  @Get('')
  @ApiOperation({ summary: 'Get direct messages' })
  async getDirectMessages(@Req() req, @Query('with') otherUserId: number) {
    const userId = req.user.id;
    const messages = await this.directMessageService.getMessagesBetweenUsers(userId, otherUserId);
    return messages;
  }
}
