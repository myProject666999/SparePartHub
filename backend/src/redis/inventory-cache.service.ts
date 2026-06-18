import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../modules/inventory/entities/inventory.entity';
import { SparePart } from '../modules/spare-part/entities/spare-part.entity';

@Injectable()
export class InventoryCacheService implements OnModuleInit {
  private readonly logger = new Logger(InventoryCacheService.name);
  private readonly INVENTORY_KEY_PREFIX = 'inventory:stock:';
  private readonly SAFETY_STOCK_KEY_PREFIX = 'inventory:safety:';
  private readonly HOT_PARTS_SET = 'inventory:hot_parts';
  private readonly HOT_PART_THRESHOLD = 5;

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(SparePart)
    private readonly sparePartRepository: Repository<SparePart>,
  ) {}

  async onModuleInit() {
    this.logger.log('初始化库存缓存...');
    await this.syncHotPartsToRedis();
    this.logger.log('库存缓存初始化完成');
  }

  private getStockKey(sparePartId: string): string {
    return `${this.INVENTORY_KEY_PREFIX}${sparePartId}`;
  }

  private getSafetyStockKey(sparePartId: string): string {
    return `${this.SAFETY_STOCK_KEY_PREFIX}${sparePartId}`;
  }

  private async syncHotPartsToRedis(): Promise<void> {
    try {
      const hotParts = await this.inventoryRepository
        .createQueryBuilder('inv')
        .innerJoin('inv.sparePart', 'sp')
        .select(['inv.sparePartId', 'inv.currentStock', 'sp.safetyStock'])
        .where('sp.isHot = :isHot', { isHot: true })
        .getRawMany();

      for (const part of hotParts) {
        const sparePartId = part.sparePartId;
        await this.redisService.set(this.getStockKey(sparePartId), part.currentStock || 0);
        await this.redisService.set(this.getSafetyStockKey(sparePartId), part.safetyStock || 0);
        await this.redisService.sadd(this.HOT_PARTS_SET, sparePartId);
      }

      this.logger.log(`已同步 ${hotParts.length} 个常用备件到Redis`);
    } catch (error) {
      this.logger.error('同步常用备件缓存失败', error.message);
    }
  }

  async getStock(sparePartId: string): Promise<number> {
    const isHot = await this.redisService.exists(this.getStockKey(sparePartId));
    if (isHot) {
      const cached = await this.redisService.get(this.getStockKey(sparePartId));
      return parseInt(cached || '0', 10);
    }

    const inventory = await this.inventoryRepository.findOne({
      where: { sparePartId },
      select: ['currentStock'],
    });
    return inventory?.currentStock || 0;
  }

  async getSafetyStock(sparePartId: string): Promise<number> {
    const cached = await this.redisService.get(this.getSafetyStockKey(sparePartId));
    if (cached !== null) {
      return parseInt(cached, 10);
    }

    const sparePart = await this.sparePartRepository.findOne({
      where: { id: sparePartId },
      select: ['safetyStock'],
    });
    return sparePart?.safetyStock || 0;
  }

  async increaseStock(sparePartId: string, quantity: number): Promise<number> {
    const isHot = await this.redisService.exists(this.getStockKey(sparePartId));
    if (isHot) {
      return this.redisService.incrby(this.getStockKey(sparePartId), quantity);
    }
    return 0;
  }

  async decreaseStock(sparePartId: string, quantity: number): Promise<number> {
    const isHot = await this.redisService.exists(this.getStockKey(sparePartId));
    if (isHot) {
      return this.redisService.decrby(this.getStockKey(sparePartId), quantity);
    }
    return 0;
  }

  async updateStockCache(sparePartId: string, stock: number): Promise<void> {
    await this.redisService.set(this.getStockKey(sparePartId), stock);
  }

  async updateSafetyStockCache(sparePartId: string, safetyStock: number): Promise<void> {
    await this.redisService.set(this.getSafetyStockKey(sparePartId), safetyStock);
  }

  async markAsHotPart(sparePartId: string): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({ where: { sparePartId } });
    const sparePart = await this.sparePartRepository.findOne({ where: { id: sparePartId } });

    if (inventory) {
      await this.redisService.set(this.getStockKey(sparePartId), inventory.currentStock || 0);
    }
    if (sparePart) {
      await this.redisService.set(this.getSafetyStockKey(sparePartId), sparePart.safetyStock || 0);
    }
    await this.redisService.sadd(this.HOT_PARTS_SET, sparePartId);
  }

  async unmarkAsHotPart(sparePartId: string): Promise<void> {
    await this.redisService.del(this.getStockKey(sparePartId));
    await this.redisService.del(this.getSafetyStockKey(sparePartId));
    await this.redisService.srem(this.HOT_PARTS_SET, sparePartId);
  }

  async getHotParts(): Promise<string[]> {
    return this.redisService.smembers(this.HOT_PARTS_SET);
  }

  async checkLowStock(): Promise<Array<{ sparePartId: string; currentStock: number; safetyStock: number }>> {
    const hotParts = await this.getHotParts();
    const lowStockItems: Array<{ sparePartId: string; currentStock: number; safetyStock: number }> = [];

    for (const partId of hotParts) {
      const currentStock = parseInt((await this.redisService.get(this.getStockKey(partId))) || '0', 10);
      const safetyStock = parseInt((await this.redisService.get(this.getSafetyStockKey(partId))) || '0', 10);

      if (currentStock <= safetyStock) {
        lowStockItems.push({ sparePartId: partId, currentStock, safetyStock });
      }
    }

    return lowStockItems;
  }
}
