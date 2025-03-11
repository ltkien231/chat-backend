import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('friend_requests')
export class FriendRequestEntity {
  @ApiProperty({ example: 1, description: 'The ID of the friendship request' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'The ID of the user sending the request' })
  @Column({ name: 'from_user' })
  from_user: number;

  @ApiProperty({ example: 2, description: 'The ID of the user receiving the request' })
  @Column({ name: 'to_user' })
  to_user: number;

  @ApiProperty({ example: 'pending', description: 'The status of the friendship' })
  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'accepted' | 'rejected';

  @ApiProperty({ example: '2021-01-01', description: 'The creation date of the request' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
