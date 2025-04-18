import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GroupMessageService } from './group-message.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('group-messages')
export class GroupMessageController {
  constructor(private readonly service: GroupMessageService) {}

  @Get('')
  @ApiOperation({ summary: 'Get group messages' })
  async getGroupMessages(@Req() req, @Query('group') groupId: number) {
    const messages = await this.service.getMessagesByGroupId(req.user.id, groupId);
    return messages;
  }
}
