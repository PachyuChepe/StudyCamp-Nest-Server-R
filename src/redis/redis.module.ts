// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const { createClient } = await import('redis');
        const client = createClient({
          url: `redis://${configService.get<string>('REDIS_ID')}:${configService.get<string>('REDIS_PW')}@${configService.get<string>('REDIS_HOST')}:${configService.get<number>('REDIS_PORT')}/0`,
        });

        client.on('connect', () => console.log('✅ Redis client connected'));
        client.on('error', (err) =>
          console.log('❌ Redis client connection error:', err),
        );

        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_PUB_CLIENT',
      useFactory: async (client) => {
        const pubClient = client.duplicate();
        await pubClient.connect();
        return pubClient;
      },
      inject: ['REDIS_CLIENT'],
    },
    {
      provide: 'REDIS_SUB_CLIENT',
      useFactory: async (client) => {
        const subClient = client.duplicate();
        await subClient.connect();
        return subClient;
      },
      inject: ['REDIS_CLIENT'],
    },
    RedisService,
  ],
  exports: [
    'REDIS_CLIENT',
    'REDIS_PUB_CLIENT',
    'REDIS_SUB_CLIENT',
    RedisService,
  ],
})
export class RedisModule {}
