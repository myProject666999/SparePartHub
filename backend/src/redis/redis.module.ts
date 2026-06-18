import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from './redis.service';
import { RedisLockService } from './redis-lock.service';
import { InventoryCacheService } from './inventory-cache.service';
import { Inventory } from '../modules/inventory/entities/inventory.entity';
import { SparePart } from '../modules/spare-part/entities/spare-part.entity';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Inventory, SparePart])],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD', undefined) || undefined,
          db: configService.get('REDIS_DB', 0),
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
        });
      },
    },
    RedisService,
    RedisLockService,
    InventoryCacheService,
  ],
  exports: ['REDIS_CLIENT', RedisService, RedisLockService, InventoryCacheService],
})
export class RedisModule {}
