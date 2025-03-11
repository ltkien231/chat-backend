import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class FriendRequestDto {
  @ApiProperty({ example: 'John Doe', description: 'The username of the user to send the request to' })
  @IsNotEmpty()
  @IsString()
  toUsername: string; // username of the user to send the request to
}

export class AcceptFriendRequestDto {
  @ApiProperty({ example: 1, description: 'The id of the request to accept' })
  @IsNotEmpty()
  @IsNumber()
  requestId: number;
}
