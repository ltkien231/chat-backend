import { Body, Request, Controller, UseGuards, Post, Get, Param, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupService } from './group.service';
import { CreateGroupDto, GroupResponseDto } from 'src/dto/group.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GroupEntity } from 'src/db/group.entity';

@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
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
    return this.groupService.getUserGroups(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group' })
  @ApiResponse({
    status: 200,
    description: 'Group retrieved successfully',
    type: GroupResponseDto,
  })
  async getGroup(@Request() req, @Param('id') id: number) {
    const group = await this.groupService.getGroup(id);
    if (!group.members.find((item) => item.userId === req.user.id)) {
      throw new BadRequestException('You are not a member of this group');
    }
    return group;
  }

  @Post(':groupId/members')
  @ApiOperation({ summary: 'Add members to group' })
  @ApiResponse({
    status: 200,
    description: 'Members added successfully',
    type: typeof {
      message: 'Members added successfully',
    },
  })
  async addMembers(@Request() req, @Param('groupId') groupId: number, @Body() body: { members: string[] }) {
    return this.groupService.addMembers(req.user.id, groupId, body.members);
  }

  @Post(':groupId/members/remove')
  @ApiOperation({ summary: 'Remove members of group' })
  @ApiResponse({
    status: 200,
    description: 'Members removed successfully',
    type: typeof {
      message: 'Members removed successfully',
    },
  })
  async removeMembers(@Request() req, @Param('groupId') groupId: number, @Body() body: { members: string[] }) {
    return this.groupService.removeMembers(req.user.id, groupId, body.members);
  }
}
