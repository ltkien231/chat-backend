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
