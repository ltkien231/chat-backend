import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe', description: 'The username of the user' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'The email of the user' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John', description: 'The first name of the user' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the user' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'password', description: 'The password of the user' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'The email of the user', required: false })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John', description: 'The first name of the user' })
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the user' })
  @IsOptional()
  @IsString()
  lastName: string;
}

export class LoginUserDto {
  @ApiProperty({ example: 'johndoe', description: 'The username of the user' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'password', description: 'The password of the user' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
