import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly LOCK_PREFIX = 'lock:';
  private readonly DEFAULT_LOCK_TTL = 30;
  private readonly DEFAULT_WAIT_TIMEOUT = 10000;
  private readonly DEFAULT_RETRY_INTERVAL = 50;

  constructor(private readonly redisService: RedisService) {}

  private getLockKey(resource: string): string {
    return `${this.LOCK_PREFIX}${resource}`;
  }

  private generateLockValue(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
  }

  async acquireLock(
    resource: string,
    ttl: number = this.DEFAULT_LOCK_TTL,
    waitTimeout: number = this.DEFAULT_WAIT_TIMEOUT,
  ): Promise<{ lockKey: string; lockValue: string } | null> {
    const lockKey = this.getLockKey(resource);
    const lockValue = this.generateLockValue();
    const startTime = Date.now();

    while (Date.now() - startTime < waitTimeout) {
      const result = await this.redisService.getClient().set(
        lockKey,
        lockValue,
        'EX',
        ttl,
        'NX',
      );

      if (result === 'OK') {
        this.logger.debug(`获取锁成功: ${lockKey} = ${lockValue}`);
        return { lockKey, lockValue };
      }

      await this.sleep(this.DEFAULT_RETRY_INTERVAL);
    }

    this.logger.warn(`获取锁超时: ${lockKey}`);
    return null;
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const script = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redisService.getClient().eval(script, 1, lockKey, lockValue);
    const success = result === 1;

    if (success) {
      this.logger.debug(`释放锁成功: ${lockKey}`);
    } else {
      this.logger.warn(`释放锁失败: ${lockKey} (锁已过期或不匹配)`);
    }

    return success;
  }

  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttl: number = this.DEFAULT_LOCK_TTL,
    waitTimeout: number = this.DEFAULT_WAIT_TIMEOUT,
  ): Promise<T> {
    const lock = await this.acquireLock(resource, ttl, waitTimeout);
    if (!lock) {
      throw new Error(`获取资源锁失败: ${resource}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lock.lockKey, lock.lockValue);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
