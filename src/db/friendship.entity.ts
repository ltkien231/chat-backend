import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('friendships')
export class FriendshipEntity {
  @ApiProperty({ example: 1, description: 'The ID of the friendship' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'The ID of the user' })
  @PrimaryColumn()
  user1_id: string;

  @ApiProperty({ example: 2, description: 'The ID of the user' })
  @PrimaryColumn()
  user2_id: string;

  @ApiProperty({ example: 1, description: 'The ID of the user' })
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_a' })
  user1: UserEntity;

  @ApiProperty({ example: 2, description: 'The ID of the user' })
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_b' })
  user2: UserEntity;

  @ApiProperty({ example: true, description: 'The request by user A' })
  @Column()
  requestByA: boolean;

  @ApiProperty({ example: 'pending', description: 'The status of the friendship' })
  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'accepted' | 'blocked';
}
