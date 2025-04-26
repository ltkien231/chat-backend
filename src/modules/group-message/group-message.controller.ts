import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GroupMessageService } from './group-message.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('group-messages')
export class GroupMessageController {
  constructor(private readonly service: GroupMessageService) {}

  @Get('')
  @ApiOperation({ summary: 'Get group messages' })
  @ApiQuery({ name: 'group', required: true, description: 'Group ID to get messages from' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of messages per page' })
  async getGroupMessages(
    @Req() req,
    @Query('group') groupId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const messages = await this.service.getMessagesByGroupId(req.user.id, groupId, page ?? 1, limit ?? 100);
    return messages;
  }
}
