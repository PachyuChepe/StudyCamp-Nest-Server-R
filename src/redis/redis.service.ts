// src/redis/redis.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_PUB_CLIENT') private pubClient,
    @Inject('REDIS_SUB_CLIENT') private subClient,
  ) {}

  getAdapter() {
    console.log('✅ Initializing Redis adapter with pub/sub clients');
    return createAdapter(this.pubClient, this.subClient);
  }
}
