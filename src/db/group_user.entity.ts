import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'group_users' })
export class GroupUserEntity {
  @ApiProperty({ example: 1, description: 'The ID of the group' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 2, description: 'The id of the group' })
  @Column()
  group_id: number;

  @ApiProperty({ example: 1, description: 'The id of the owner' })
  @Column()
  user_id: number;

  @ApiProperty({ example: '2021-01-01', description: 'The creation date' })
  @Column({ name: 'created_at' })
  createdAt: Date;
}
