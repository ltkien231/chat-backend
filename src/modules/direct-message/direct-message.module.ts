import { Module } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageController } from './direct-message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessageEntity } from 'src/db/direct_message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DirectMessageEntity])],
  providers: [DirectMessageService],
  controllers: [DirectMessageController],
  exports: [DirectMessageService],
})
export class DirectMessageModule {}
