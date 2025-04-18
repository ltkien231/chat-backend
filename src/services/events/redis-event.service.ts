import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisEventService implements OnModuleInit, OnModuleDestroy {
  private publisher: ReturnType<typeof createClient>;
  private subscriber: ReturnType<typeof createClient>;
  private readonly eventHandlers = new Map<string, Array<(data: any) => void>>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const env = this.configService.get('env');
      const redisConfig = this.configService.get('redis');

      // Create Redis clients
      this.publisher =
        env === 'dev'
          ? createClient({ url: 'redis://localhost:6379' })
          : createClient({
              url: redisConfig.url,
              password: redisConfig.password,
              socket: {
                tls: true,
                rejectUnauthorized: true,
              },
            });

      this.subscriber = this.publisher.duplicate();

      // Connect to Redis
      await this.publisher.connect();
      await this.subscriber.connect();

      // Set up message handler
      this.subscriber.on('message', (channel, message) => {
        const handlers = this.eventHandlers.get(channel);
        if (handlers) {
          const data = JSON.parse(message);
          handlers.forEach((handler) => handler(data));
        }
      });

      console.log('Redis Event Service initialized');
    } catch (error) {
      console.error('Failed to initialize Redis Event Service:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.publisher?.disconnect();
      await this.subscriber?.disconnect();
    } catch (error) {
      console.error('Error disconnecting Redis clients:', error);
    }
  }

  /**
   * Publish an event to a channel
   * @param channel The event channel name
   * @param data The event payload
   */
  async publish(channel: string, data: any): Promise<void> {
    if (!this.publisher?.isOpen) {
      throw new Error('Redis publisher not connected');
    }

    await this.publisher.publish(channel, JSON.stringify(data));
  }

  /**
   * Subscribe to an event channel
   * @param channel The event channel name
   * @param handler The function to call when an event is received
   */
  async subscribe(channel: string, handler: (data: any) => void): Promise<void> {
    if (!this.subscriber?.isOpen) {
      throw new Error('Redis subscriber not connected');
    }

    // Store the handler
    if (!this.eventHandlers.has(channel)) {
      this.eventHandlers.set(channel, []);
      // Only subscribe if this is the first handler
      await this.subscriber.subscribe(channel, (message) => {
        const data = JSON.parse(message);
        const handlers = this.eventHandlers.get(channel);
        handlers?.forEach((h) => h(data));
      });
    }

    this.eventHandlers.get(channel).push(handler);
  }

  /**
   * Unsubscribe from an event channel
   * @param channel The event channel name
   * @param handler The handler function to remove
   */
  async unsubscribe(channel: string, handler?: (data: any) => void): Promise<void> {
    if (!this.subscriber?.isOpen) {
      return;
    }

    if (handler && this.eventHandlers.has(channel)) {
      const handlers = this.eventHandlers.get(channel);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        // If no handlers left, unsubscribe from the channel
        if (handlers.length === 0) {
          this.eventHandlers.delete(channel);
          await this.subscriber.unsubscribe(channel);
        }
      }
    } else {
      // Remove all handlers for this channel
      this.eventHandlers.delete(channel);
      await this.subscriber.unsubscribe(channel);
    }
  }
}
