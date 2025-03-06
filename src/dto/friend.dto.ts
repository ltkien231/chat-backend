import { IsNotEmpty, IsString } from 'class-validator';

export class FriendRequestDto {
  @IsNotEmpty()
  @IsString()
  toUsername: string; // username of the user to send the request to
}
