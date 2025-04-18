import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'My Group', description: 'The name of the group' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: ['A', 'B'], description: 'username of members, excluding the owner/sender' })
  @IsNotEmpty()
  @IsString({ each: true })
  members: string[];
}

export class GroupMemberDto {
  @ApiProperty({ example: 1, description: 'The ID of the group' })
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ example: 'John', description: 'The name of the user' })
  @IsNotEmpty()
  @IsString()
  username: string;
}

export class GroupResponseDto {
  @ApiProperty({ example: 1, description: 'The ID of the group' })
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'My Group', description: 'The name of the group' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the owner' })
  @IsNotEmpty()
  owner: number;

  @ApiProperty({
    example: [
      { userId: 1, username: 'John' },
      { userId: 2, username: 'Jane' },
    ],
    description: 'Members of the group',
  })
  @IsNotEmpty()
  members: GroupMemberDto[];
}
