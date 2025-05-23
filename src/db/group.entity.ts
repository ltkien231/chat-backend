import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'chat_groups' })
export class GroupEntity {
  @ApiProperty({ example: 1, description: 'The ID of the group' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'My chat room', description: 'The name of the group' })
  @Column()
  name: string;

  @ApiProperty({ example: 2, description: 'The id of the owner' })
  @Column()
  owner: number;

  @ApiProperty({ example: '2021-01-01', description: 'The creation date' })
  @Column({ name: 'created_at' })
  createdAt: Date;
}
