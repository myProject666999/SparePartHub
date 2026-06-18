import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Brackets } from 'typeorm';
import { StockMovement, StockMovementType } from '../stock-movement/entities/stock-movement.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { SparePart, SparePartCategory } from '../spare-part/entities/spare-part.entity';
import { MaintenanceRecord } from '../maintenance/entities/maintenance-record.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { ApiResponse } from '../../common/dto/response.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(SparePart)
    private readonly sparePartRepository: Repository<SparePart>,
    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRecordRepository: Repository<MaintenanceRecord>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async getConsumptionByEquipment(
    startDate?: string,
    endDate?: string,
    topN: number = 10,
  ): Promise<ApiResponse<any>> {
    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').startOf('day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : new Date();

    const results = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .innerJoin(Equipment, 'eq', 'eq.id = sm.equipmentId')
      .select('eq.id', 'equipmentId')
      .addSelect('eq.code', 'equipmentCode')
      .addSelect('eq.name', 'equipmentName')
      .addSelect('eq.workshop', 'workshop')
      .addSelect('COUNT(DISTINCT sm.id)', 'consumptionCount')
      .addSelect('SUM(ABS(sm.quantity))', 'totalQuantity')
      .addSelect('SUM(ABS(sm.totalAmount))', 'totalAmount')
      .where('sm.movementType = :type', { type: StockMovementType.OUTBOUND })
      .andWhere('sm.equipmentId IS NOT NULL')
      .andWhere('sm.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('eq.id')
      .orderBy('totalAmount', 'DESC')
      .limit(topN)
      .getRawMany();

    return ApiResponse.success({
      period: { start: dayjs(start).format('YYYY-MM-DD'), end: dayjs(end).format('YYYY-MM-DD') },
      list: results.map((r) => ({
        ...r,
        consumptionCount: parseInt(r.consumptionCount || 0),
        totalQuantity: parseInt(r.totalQuantity || 0),
        totalAmount: parseFloat(r.totalAmount || 0),
      })),
    });
  }

  async getConsumptionBySparePart(
    startDate?: string,
    endDate?: string,
    topN: number = 20,
  ): Promise<ApiResponse<any>> {
    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').startOf('day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : new Date();

    const results = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .innerJoin(SparePart, 'sp', 'sp.id = sm.sparePartId')
      .select('sp.id', 'sparePartId')
      .addSelect('sp.code', 'sparePartCode')
      .addSelect('sp.name', 'sparePartName')
      .addSelect('sp.category', 'category')
      .addSelect('sp.unit', 'unit')
      .addSelect('COUNT(DISTINCT sm.id)', 'consumptionCount')
      .addSelect('SUM(ABS(sm.quantity))', 'totalQuantity')
      .addSelect('SUM(ABS(sm.totalAmount))', 'totalAmount')
      .where('sm.movementType = :type', { type: StockMovementType.OUTBOUND })
      .andWhere('sm.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('sp.id')
      .orderBy('totalAmount', 'DESC')
      .limit(topN)
      .getRawMany();

    return ApiResponse.success({
      period: { start: dayjs(start).format('YYYY-MM-DD'), end: dayjs(end).format('YYYY-MM-DD') },
      list: results.map((r) => ({
        ...r,
        consumptionCount: parseInt(r.consumptionCount || 0),
        totalQuantity: parseInt(r.totalQuantity || 0),
        totalAmount: parseFloat(r.totalAmount || 0),
      })),
    });
  }

  async getConsumptionByCategory(
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<any>> {
    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').startOf('day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : new Date();

    const results = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .innerJoin(SparePart, 'sp', 'sp.id = sm.sparePartId')
      .select('sp.category', 'category')
      .addSelect('COUNT(DISTINCT sm.id)', 'consumptionCount')
      .addSelect('SUM(ABS(sm.quantity))', 'totalQuantity')
      .addSelect('SUM(ABS(sm.totalAmount))', 'totalAmount')
      .where('sm.movementType = :type', { type: StockMovementType.OUTBOUND })
      .andWhere('sm.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('sp.category')
      .orderBy('totalAmount', 'DESC')
      .getRawMany();

    const categoryNames: Record<string, string> = {
      bearing: '轴承',
      belt: '皮带',
      motor: '电机',
      sensor: '传感器',
      seal: '密封件',
      gear: '齿轮',
      other: '其他',
    };

    return ApiResponse.success({
      period: { start: dayjs(start).format('YYYY-MM-DD'), end: dayjs(end).format('YYYY-MM-DD') },
      list: results.map((r) => ({
        ...r,
        categoryName: categoryNames[r.category] || r.category,
        consumptionCount: parseInt(r.consumptionCount || 0),
        totalQuantity: parseInt(r.totalQuantity || 0),
        totalAmount: parseFloat(r.totalAmount || 0),
      })),
    });
  }

  async getConsumptionTrend(days: number = 30): Promise<ApiResponse<any>> {
    const start = dayjs().subtract(days - 1, 'day').startOf('day').toDate();
    const end = new Date();

    const results = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .select("DATE_FORMAT(sm.createdAt, '%Y-%m-%d')", 'date')
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'outbound' THEN ABS(sm.quantity) ELSE 0 END)",
        'outboundQty',
      )
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'outbound' THEN ABS(sm.totalAmount) ELSE 0 END)",
        'outboundAmount',
      )
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'inbound' THEN sm.quantity ELSE 0 END)",
        'inboundQty',
      )
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'inbound' THEN sm.totalAmount ELSE 0 END)",
        'inboundAmount',
      )
      .where('sm.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const dateSet = new Set(results.map((r) => r.date));
    const filledResults: any[] = [];
    let current = dayjs(start);
    const endDate = dayjs(end);

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      const existing = results.find((r) => r.date === dateStr);
      filledResults.push({
        date: dateStr,
        outboundQty: existing ? parseInt(existing.outboundQty || 0) : 0,
        outboundAmount: existing ? parseFloat(existing.outboundAmount || 0) : 0,
        inboundQty: existing ? parseInt(existing.inboundQty || 0) : 0,
        inboundAmount: existing ? parseFloat(existing.inboundAmount || 0) : 0,
      });
      current = current.add(1, 'day');
    }

    return ApiResponse.success({
      period: { days },
      list: filledResults,
    });
  }

  async getEquipmentSparePartDetail(
    equipmentId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<any>> {
    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(90, 'day').startOf('day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : new Date();

    const results = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .innerJoin(SparePart, 'sp', 'sp.id = sm.sparePartId')
      .select('sp.id', 'sparePartId')
      .addSelect('sp.code', 'sparePartCode')
      .addSelect('sp.name', 'sparePartName')
      .addSelect('sp.specification', 'specification')
      .addSelect('sp.unit', 'unit')
      .addSelect('COUNT(DISTINCT sm.id)', 'usageCount')
      .addSelect('SUM(ABS(sm.quantity))', 'totalQuantity')
      .addSelect('SUM(ABS(sm.totalAmount))', 'totalAmount')
      .where('sm.movementType = :type', { type: StockMovementType.OUTBOUND })
      .andWhere('sm.equipmentId = :equipmentId', { equipmentId })
      .andWhere('sm.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('sp.id')
      .orderBy('totalAmount', 'DESC')
      .getRawMany();

    const equipment = await this.equipmentRepository.findOne({ where: { id: equipmentId } });

    return ApiResponse.success({
      equipment,
      period: { start: dayjs(start).format('YYYY-MM-DD'), end: dayjs(end).format('YYYY-MM-DD') },
      list: results.map((r) => ({
        ...r,
        usageCount: parseInt(r.usageCount || 0),
        totalQuantity: parseInt(r.totalQuantity || 0),
        totalAmount: parseFloat(r.totalAmount || 0),
      })),
    });
  }

  async getDashboardStats(): Promise<ApiResponse<any>> {
    const now = new Date();
    const monthStart = dayjs().startOf('month').toDate();
    const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

    const totalSpareParts = await this.sparePartRepository.count();
    const totalEquipments = await this.equipmentRepository.count();

    const currentMonthStats = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .select(
        "SUM(CASE WHEN sm.movementType = 'inbound' THEN sm.quantity ELSE 0 END)",
        'inboundQty',
      )
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'outbound' THEN ABS(sm.quantity) ELSE 0 END)",
        'outboundQty',
      )
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'inbound' THEN sm.totalAmount ELSE 0 END)",
        'inboundAmount',
      )
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'outbound' THEN ABS(sm.totalAmount) ELSE 0 END)",
        'outboundAmount',
      )
      .where('sm.createdAt >= :monthStart', { monthStart })
      .getRawOne();

    const lastMonthStats = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .select(
        "SUM(CASE WHEN sm.movementType = 'outbound' THEN ABS(sm.totalAmount) ELSE 0 END)",
        'outboundAmount',
      )
      .where('sm.createdAt BETWEEN :start AND :end', {
        start: lastMonthStart,
        end: lastMonthEnd,
      })
      .getRawOne();

    const currentOutbound = parseFloat(currentMonthStats.outboundAmount || 0);
    const lastOutbound = parseFloat(lastMonthStats.outboundAmount || 0);
    const monthGrowthRate =
      lastOutbound > 0 ? Math.round(((currentOutbound - lastOutbound) / lastOutbound) * 100) : 0;

    const maintenanceThisMonth = await this.maintenanceRecordRepository.count({
      where: { createdAt: Between(monthStart, now) },
    });

    const inventoryValue = await this.inventoryRepository
      .createQueryBuilder('i')
      .innerJoin(SparePart, 'sp', 'sp.id = i.sparePartId')
      .select('COALESCE(SUM(sp.unitPrice * i.currentStock), 0)', 'total')
      .getRawOne();

    const lowStockCount = await this.inventoryRepository
      .createQueryBuilder('inv')
      .innerJoin(SparePart, 'sp', 'sp.id = inv.sparePartId')
      .where('inv.currentStock <= sp.safetyStock')
      .getCount();

    return ApiResponse.success({
      overview: {
        totalSpareParts,
        totalEquipments,
        maintenanceThisMonth,
        inventoryValue: parseFloat(inventoryValue.total || 0),
        lowStockCount,
      },
      currentMonth: {
        inboundQty: parseInt(currentMonthStats.inboundQty || 0),
        outboundQty: parseInt(currentMonthStats.outboundQty || 0),
        inboundAmount: parseFloat(currentMonthStats.inboundAmount || 0),
        outboundAmount: currentOutbound,
      },
      comparison: {
        lastMonthOutboundAmount: lastOutbound,
        monthGrowthRate,
      },
    });
  }
}
