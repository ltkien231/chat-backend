import { Module, Global } from '@nestjs/common';
import { RedisEventService } from './redis-event.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisEventService],
  exports: [RedisEventService],
})
export class EventsModule {}
