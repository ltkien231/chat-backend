import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'users' })
export class UserEntity {
  @ApiProperty({ example: 1, description: 'The ID of the user' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'johndoe', description: 'The username of the user' })
  @Column()
  username: string;

  @ApiProperty({ example: 'John', description: 'The first name of the user' })
  @Column({ name: 'first_name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the user' })
  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  password: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'The email of the user' })
  @Column()
  email: string;

  @ApiProperty({ example: '2021-01-01', description: 'The creation date of the user' })
  @Column({ name: 'created_at' })
  createdAt: Date;
}
