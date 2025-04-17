import { Body, Request, Controller, UseGuards, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupService } from './group.service';
import { CreateGroupDto } from 'src/dto/group.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private groupService: GroupService) {}

  @Post('')
  async createGroup(@Request() req, @Body() body: CreateGroupDto) {
    return this.groupService.createGroup(body.name, req.user.id, body.members);
  }
}
