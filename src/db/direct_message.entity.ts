import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('direct_messages')
export class DirectMessageEntity {
  @ApiProperty({ example: 1, description: 'The ID of the direct message' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'The ID of the sender' })
  @Column({ name: 'from_user' })
  fromUser: number;

  @ApiProperty({ example: 2, description: 'The ID of the receiver' })
  @Column({ name: 'to_user' })
  toUser: number;

  @ApiProperty({ example: 'Hello!', description: 'The content of the message' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'The binary content of the attachment' })
  @Column({ type: 'mediumblob' })
  attachment: Buffer;

  @ApiProperty({ example: 'image/png', description: 'The MIME type of the attachment' })
  @Column({ type: 'varchar', name: 'attachment_type' })
  attachmentType: string;

  @ApiProperty({ example: '2021-01-01', description: 'The creation date of the message' })
  @Column({ name: 'created_at' })
  createdAt: Date;
}
