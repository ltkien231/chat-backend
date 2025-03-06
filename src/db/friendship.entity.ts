import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user/user.entity';

@Entity('friendships')
export class FriendshipEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn()
  user1_id: string;

  @PrimaryColumn()
  user2_id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_a' })
  user1: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_b' })
  user2: UserEntity;

  @Column()
  requestByA: boolean;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'accepted' | 'blocked';
}
