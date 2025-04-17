import { Controller, Request, Get, UseGuards, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserEntity } from '../../db/user.entity';
import { UpdateProfileDto } from 'src/dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: UserEntity,
  })
  async regiser(@Request() req) {
    const user = await this.userService.findOneById(req.user.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  @Post('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'The updated record',
    type: UserEntity,
  })
  async update(@Request() req, @Body() body: UpdateProfileDto) {
    const user = await this.userService.updateProfile(req.user.id, body);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
