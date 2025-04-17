import { Body, Request, Controller, UseGuards, Post, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupService } from './group.service';
import { CreateGroupDto, GroupResponseDto } from 'src/dto/group.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GroupEntity } from 'src/db/group.entity';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private groupService: GroupService) {}

  @Post('')
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({
    status: 201,
    description: 'Group created successfully',
    type: GroupEntity,
  })
  async createGroup(@Request() req, @Body() body: CreateGroupDto) {
    body.members.push(req.user.username);
    return this.groupService.createGroup(body.name, req.user.id, body.members);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get my groups' })
  @ApiResponse({
    status: 200,
    description: 'My groups retrieved successfully',
    type: GroupResponseDto,
    isArray: true,
  })
  async getMyGroups(@Request() req) {
    return this.groupService.getMyGroups(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group' })
  @ApiResponse({
    status: 200,
    description: 'Group retrieved successfully',
    type: GroupResponseDto,
  })
  async getGroup(@Param('id') id: number) {
    return await this.groupService.getGroup(id);
  }
}
