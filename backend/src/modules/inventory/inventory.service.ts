import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { SparePart } from '../spare-part/entities/spare-part.entity';
import { StockMovement, StockMovementType, StockMovementStatus } from '../stock-movement/entities/stock-movement.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { MaintenanceRecord } from '../maintenance/entities/maintenance-record.entity';
import { StockInDto, StockOutDto, ScanStockOutDto, StockAdjustDto, QueryInventoryDto } from './dto/inventory.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { generateOrderNo } from '../../common/utils/order.utils';
import { RedisLockService } from '../../redis/redis-lock.service';
import { InventoryCacheService } from '../../redis/inventory-cache.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(SparePart)
    private readonly sparePartRepository: Repository<SparePart>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRecordRepository: Repository<MaintenanceRecord>,
    private readonly dataSource: DataSource,
    private readonly redisLockService: RedisLockService,
    private readonly inventoryCacheService: InventoryCacheService,
  ) {}

  async stockIn(dto: StockInDto): Promise<ApiResponse<StockMovement>> {
    const { sparePartId, quantity } = dto;

    const sparePart = await this.sparePartRepository.findOne({ where: { id: sparePartId } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }

    return this.redisLockService.withLock(
      `inventory:${sparePartId}`,
      async () => {
        return this.dataSource.transaction(async (manager) => {
          const inventory = await manager.findOne(Inventory, {
            where: { sparePartId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!inventory) {
            throw new NotFoundException('库存记录不存在');
          }

          const stockBefore = inventory.currentStock;
          const stockAfter = stockBefore + quantity;
          const unitPrice = dto.unitPrice ?? sparePart.unitPrice;
          const totalAmount = unitPrice * quantity;

          inventory.currentStock = stockAfter;
          inventory.totalInbound += quantity;
          inventory.inventoryValue += totalAmount;
          inventory.lastInboundAt = new Date();
          inventory.updatedBy = dto.operator || 'system';

          await manager.save(inventory);

          const movement = manager.create(StockMovement, {
            orderNo: generateOrderNo('RK'),
            sparePartId,
            movementType: StockMovementType.INBOUND,
            quantity,
            stockBefore,
            stockAfter,
            unitPrice,
            totalAmount,
            relatedOrderNo: dto.relatedOrderNo,
            supplierName: dto.supplierName,
            operator: dto.operator,
            status: StockMovementStatus.COMPLETED,
            remark: dto.remark,
            createdBy: dto.operator || 'system',
          });

          const savedMovement = await manager.save(movement);

          await this.inventoryCacheService.increaseStock(sparePartId, quantity);
          await this.inventoryCacheService.updateStockCache(sparePartId, stockAfter);

          this.logger.log(`入库成功: 备件[${sparePart.code}] +${quantity}，当前库存: ${stockAfter}`);

          return savedMovement;
        });
      },
    ).then((movement) => ApiResponse.success(movement, '入库成功'));
  }

  async stockOut(dto: StockOutDto): Promise<ApiResponse<StockMovement>> {
    const { sparePartId, quantity, equipmentId, maintenanceRecordId } = dto;

    const sparePart = await this.sparePartRepository.findOne({ where: { id: sparePartId } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }

    return this.redisLockService.withLock(
      `inventory:${sparePartId}`,
      async () => {
        return this.dataSource.transaction(async (manager) => {
          const inventory = await manager.findOne(Inventory, {
            where: { sparePartId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!inventory) {
            throw new NotFoundException('库存记录不存在');
          }

          if (inventory.currentStock < quantity) {
            throw new BadRequestException(
              `库存不足，当前库存: ${inventory.currentStock}，需要: ${quantity}`,
            );
          }

          const stockBefore = inventory.currentStock;
          const stockAfter = stockBefore - quantity;
          const unitPrice = sparePart.unitPrice;
          const totalAmount = unitPrice * quantity;

          inventory.currentStock = stockAfter;
          inventory.totalOutbound += quantity;
          inventory.inventoryValue = Math.max(0, inventory.inventoryValue - totalAmount);
          inventory.lastOutboundAt = new Date();
          inventory.updatedBy = dto.operator || 'system';

          await manager.save(inventory);

          const movement = manager.create(StockMovement, {
            orderNo: generateOrderNo('CK'),
            sparePartId,
            movementType: StockMovementType.OUTBOUND,
            quantity: -quantity,
            stockBefore,
            stockAfter,
            unitPrice,
            totalAmount,
            equipmentId,
            maintenanceRecordId,
            operator: dto.operator,
            department: dto.department,
            status: StockMovementStatus.COMPLETED,
            remark: dto.remark,
            createdBy: dto.operator || 'system',
          });

          const savedMovement = await manager.save(movement);

          if (maintenanceRecordId) {
            await manager
              .createQueryBuilder()
              .update(MaintenanceRecord)
              .set({
                sparePartCost: () => `sparePartCost + ${totalAmount}`,
                totalCost: () => `totalCost + ${totalAmount}`,
              })
              .where('id = :id', { id: maintenanceRecordId })
              .execute();
          }

          await manager
            .createQueryBuilder()
            .update(Equipment)
            .set({
              totalSparePartCost: () => `totalSparePartCost + ${totalAmount}`,
            })
            .where('id = :id', { id: equipmentId })
            .execute();

          await this.inventoryCacheService.decreaseStock(sparePartId, quantity);
          await this.inventoryCacheService.updateStockCache(sparePartId, stockAfter);

          this.logger.warn(
            `出库成功: 备件[${sparePart.code}] -${quantity}，当前库存: ${stockAfter}，安全库存: ${sparePart.safetyStock}`,
          );

          if (stockAfter < sparePart.safetyStock) {
            this.logger.warn(
              `⚠️ 库存告警: 备件[${sparePart.code}] 当前库存(${stockAfter})已低于安全库存(${sparePart.safetyStock})，请及时采购！`,
            );
          }

          return savedMovement;
        });
      },
    ).then((movement) => ApiResponse.success(movement, '出库成功'));
  }

  async scanStockOut(dto: ScanStockOutDto): Promise<ApiResponse<StockMovement>> {
    const sparePart = await this.sparePartRepository.findOne({
      where: [{ barcode: dto.barcode }, { code: dto.barcode }],
    });
    if (!sparePart) {
      throw new NotFoundException('未找到对应备件，请检查条码');
    }

    const equipment = await this.equipmentRepository.findOne({
      where: [{ code: dto.equipmentCode }],
    });
    if (!equipment) {
      throw new NotFoundException('未找到对应设备，请检查设备编码');
    }

    let maintenanceRecordId: string | undefined;
    if (dto.maintenanceOrderNo) {
      const mr = await this.maintenanceRecordRepository.findOne({
        where: { orderNo: dto.maintenanceOrderNo },
      });
      if (mr) {
        maintenanceRecordId = mr.id;
      }
    }

    return this.stockOut({
      sparePartId: sparePart.id,
      quantity: dto.quantity,
      equipmentId: equipment.id,
      maintenanceRecordId,
      operator: dto.operator,
      remark: dto.remark,
    });
  }

  async stockAdjust(dto: StockAdjustDto): Promise<ApiResponse<StockMovement>> {
    const { sparePartId, actualStock } = dto;

    const sparePart = await this.sparePartRepository.findOne({ where: { id: sparePartId } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }

    return this.redisLockService.withLock(
      `inventory:${sparePartId}`,
      async () => {
        return this.dataSource.transaction(async (manager) => {
          const inventory = await manager.findOne(Inventory, {
            where: { sparePartId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!inventory) {
            throw new NotFoundException('库存记录不存在');
          }

          const stockBefore = inventory.currentStock;
          const diff = actualStock - stockBefore;

          if (diff === 0) {
            throw new BadRequestException('实际库存与系统库存一致，无需调整');
          }

          const movementType =
            diff > 0 ? StockMovementType.ADJUSTMENT_PLUS : StockMovementType.ADJUSTMENT_MINUS;
          const unitPrice = sparePart.unitPrice;
          const totalAmount = Math.abs(diff) * unitPrice;

          inventory.currentStock = actualStock;
          inventory.inventoryValue = Math.max(0, inventory.inventoryValue + diff * unitPrice);
          inventory.lastStocktakeAt = new Date();
          inventory.updatedBy = dto.operator || 'system';

          if (diff > 0) {
            inventory.totalInbound += diff;
          } else {
            inventory.totalOutbound += Math.abs(diff);
          }

          await manager.save(inventory);

          const movement = manager.create(StockMovement, {
            orderNo: generateOrderNo('PZ'),
            sparePartId,
            movementType,
            quantity: diff,
            stockBefore,
            stockAfter: actualStock,
            unitPrice,
            totalAmount: diff > 0 ? totalAmount : -totalAmount,
            operator: dto.operator,
            status: StockMovementStatus.COMPLETED,
            remark: `盘点调整，原库存:${stockBefore}，实盘:${actualStock}，差异:${diff > 0 ? '+' : ''}${diff}。${dto.remark || ''}`,
            createdBy: dto.operator || 'system',
          });

          const savedMovement = await manager.save(movement);
          await this.inventoryCacheService.updateStockCache(sparePartId, actualStock);

          return savedMovement;
        });
      },
    ).then((movement) => ApiResponse.success(movement, '库存调整成功'));
  }

  async getInventory(sparePartId: string): Promise<ApiResponse<any>> {
    const inventory = await this.inventoryRepository
      .createQueryBuilder('inv')
      .innerJoinAndSelect('inv.sparePart', 'sp')
      .where('inv.sparePartId = :sparePartId', { sparePartId })
      .getOne();

    if (!inventory) {
      throw new NotFoundException('库存记录不存在');
    }

    const cachedStock = await this.inventoryCacheService.getStock(sparePartId);

    return ApiResponse.success({
      ...inventory,
      cachedStock,
      isLow: inventory.currentStock <= inventory.sparePart.safetyStock,
    });
  }

  async getAllInventory(dto: QueryInventoryDto): Promise<ApiResponse<PaginatedResponse<any>>> {
    const { page = 1, pageSize = 20, keyword, onlyLowStock, onlyHot, category } = dto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inv')
      .innerJoinAndSelect('inv.sparePart', 'sp');

    if (keyword) {
      queryBuilder.andWhere(
        '(sp.name LIKE :keyword OR sp.code LIKE :keyword OR sp.specification LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('sp.category = :category', { category });
    }

    if (onlyHot) {
      queryBuilder.andWhere('sp.isHot = :isHot', { isHot: true });
    }

    if (onlyLowStock) {
      queryBuilder.andWhere('inv.currentStock <= sp.safetyStock');
    }

    const [entities, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('inv.updatedAt', 'DESC')
      .getManyAndCount();

    const list = entities.map((entity: any) => ({
      ...entity,
      isLowStock: entity.currentStock <= entity.sparePart.safetyStock,
    }));

    return ApiResponse.success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  async getLowStockList(): Promise<ApiResponse<any[]>> {
    const redisLowStock = await this.inventoryCacheService.checkLowStock();

    const dbLowStock = await this.inventoryRepository
      .createQueryBuilder('inv')
      .innerJoinAndSelect('inv.sparePart', 'sp')
      .where('inv.currentStock <= sp.safetyStock')
      .andWhere('sp.isHot = :isHot', { isHot: false })
      .getMany();

    const redisItems = await Promise.all(
      redisLowStock.map(async (item) => {
        const sp = await this.sparePartRepository.findOne({ where: { id: item.sparePartId } });
        return {
          sparePart: sp,
          currentStock: item.currentStock,
          safetyStock: item.safetyStock,
          gap: item.safetyStock - item.currentStock,
        };
      }),
    );

    const dbItems = dbLowStock.map((item) => ({
      sparePart: item.sparePart,
      currentStock: item.currentStock,
      safetyStock: item.sparePart.safetyStock,
      gap: item.sparePart.safetyStock - item.currentStock,
    }));

    const combined = [...redisItems, ...dbItems].filter((item) => item.sparePart);
    combined.sort((a, b) => b.gap - a.gap);

    return ApiResponse.success(combined, '获取低库存清单成功');
  }

  async getInventoryStats(): Promise<ApiResponse<any>> {
    const totalCount = await this.inventoryRepository.count();
    const totalValue = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.inventoryValue), 0)', 'totalValue')
      .getRawOne();

    const lowStockCount = await this.inventoryRepository
      .createQueryBuilder('inv')
      .innerJoin(SparePart, 'sp', 'sp.id = inv.sparePartId')
      .where('inv.currentStock <= sp.safetyStock')
      .getCount();

    const outOfStockCount = await this.inventoryRepository.count({
      where: { currentStock: 0 },
    });

    const hotPartsCount = await this.inventoryRepository
      .createQueryBuilder('inv')
      .innerJoin(SparePart, 'sp', 'sp.id = inv.sparePartId')
      .where('sp.isHot = :isHot', { isHot: true })
      .getCount();

    return ApiResponse.success({
      totalSpareParts: totalCount,
      totalInventoryValue: parseFloat(totalValue.totalValue || 0),
      lowStockCount,
      outOfStockCount,
      hotPartsCount,
    });
  }
}
