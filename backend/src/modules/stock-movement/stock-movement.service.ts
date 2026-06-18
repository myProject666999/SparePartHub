import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity';
import { SparePart } from '../spare-part/entities/spare-part.entity';
import { QueryStockMovementDto } from '../inventory/dto/inventory.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class StockMovementService {
  private readonly logger = new Logger(StockMovementService.name);

  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
  ) {}

  async findAll(dto: QueryStockMovementDto): Promise<ApiResponse<PaginatedResponse<any>>> {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      sparePartId,
      equipmentId,
      movementType,
      startDate,
      endDate,
      operator,
    } = dto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.stockMovementRepository
      .createQueryBuilder('sm')
      .leftJoinAndSelect('sm.sparePart', 'sp')
      .leftJoin('Equipment', 'eq', 'eq.id = sm.equipmentId')
      .addSelect(['eq.code as equipmentCode', 'eq.name as equipmentName']);

    if (keyword) {
      queryBuilder.andWhere(
        '(sm.orderNo LIKE :keyword OR sp.name LIKE :keyword OR sp.code LIKE :keyword OR sm.relatedOrderNo LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (sparePartId) {
      queryBuilder.andWhere('sm.sparePartId = :sparePartId', { sparePartId });
    }

    if (equipmentId) {
      queryBuilder.andWhere('sm.equipmentId = :equipmentId', { equipmentId });
    }

    if (movementType) {
      queryBuilder.andWhere('sm.movementType = :movementType', { movementType });
    }

    if (startDate) {
      const start = dayjs(startDate).startOf('day').toDate();
      queryBuilder.andWhere('sm.createdAt >= :start', { start });
    }

    if (endDate) {
      const end = dayjs(endDate).endOf('day').toDate();
      queryBuilder.andWhere('sm.createdAt <= :end', { end });
    }

    if (operator) {
      queryBuilder.andWhere('(sm.operator LIKE :operator OR sm.createdBy LIKE :operator)', {
        operator: `%${operator}%`,
      });
    }

    const [entities, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('sm.createdAt', 'DESC')
      .getManyAndCount();

    const list = entities.map((entity: any) => ({
      ...entity,
      equipmentCode: entity.equipment?.code,
      equipmentName: entity.equipment?.name,
    }));

    return ApiResponse.success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  async findById(id: string): Promise<ApiResponse<any>> {
    const movement = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .leftJoinAndSelect('sm.sparePart', 'sp')
      .leftJoin('Equipment', 'eq', 'eq.id = sm.equipmentId')
      .addSelect(['eq.code', 'eq.name'])
      .leftJoin('MaintenanceRecord', 'mr', 'mr.id = sm.maintenanceRecordId')
      .addSelect(['mr.orderNo as maintenanceOrderNo'])
      .where('sm.id = :id', { id })
      .getRawOne();

    return ApiResponse.success(movement);
  }

  async findByOrderNo(orderNo: string): Promise<ApiResponse<any>> {
    const movement = await this.stockMovementRepository.findOne({
      where: { orderNo },
      relations: ['sparePart'],
    });
    return ApiResponse.success(movement);
  }

  async getTraceList(sparePartId: string): Promise<ApiResponse<any[]>> {
    const movements = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .leftJoinAndSelect('sm.sparePart', 'sp')
      .leftJoin('Equipment', 'eq', 'eq.id = sm.equipmentId')
      .addSelect(['eq.code as equipmentCode', 'eq.name as equipmentName'])
      .where('sm.sparePartId = :sparePartId', { sparePartId })
      .orderBy('sm.createdAt', 'DESC')
      .limit(100)
      .getRawMany();

    return ApiResponse.success(movements);
  }

  async getMovementStats(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    const start = dayjs(startDate || dayjs().subtract(30, 'day').format('YYYY-MM-DD'))
      .startOf('day')
      .toDate();
    const end = dayjs(endDate || dayjs().format('YYYY-MM-DD')).endOf('day').toDate();

    const inboundStats = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .select('COALESCE(COUNT(*), 0)', 'inboundCount')
      .addSelect('COALESCE(SUM(CASE WHEN sm.quantity > 0 THEN sm.quantity ELSE 0 END), 0)', 'inboundQty')
      .addSelect('COALESCE(SUM(CASE WHEN sm.totalAmount > 0 THEN sm.totalAmount ELSE 0 END), 0)', 'inboundAmount')
      .where('sm.movementType = :type', { type: StockMovementType.INBOUND })
      .andWhere('sm.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const outboundStats = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .select('COALESCE(COUNT(*), 0)', 'outboundCount')
      .addSelect('COALESCE(SUM(CASE WHEN sm.quantity < 0 THEN ABS(sm.quantity) ELSE 0 END), 0)', 'outboundQty')
      .addSelect('COALESCE(SUM(CASE WHEN sm.totalAmount < 0 THEN ABS(sm.totalAmount) ELSE 0 END), 0)', 'outboundAmount')
      .where('sm.movementType = :type', { type: StockMovementType.OUTBOUND })
      .andWhere('sm.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const dailyTrend = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .select("DATE_FORMAT(sm.createdAt, '%Y-%m-%d')", 'date')
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'inbound' THEN sm.quantity ELSE 0 END)",
        'inboundQty',
      )
      .addSelect(
        "SUM(CASE WHEN sm.movementType = 'outbound' THEN ABS(sm.quantity) ELSE 0 END)",
        'outboundQty',
      )
      .where('sm.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return ApiResponse.success({
      period: {
        start: dayjs(start).format('YYYY-MM-DD'),
        end: dayjs(end).format('YYYY-MM-DD'),
      },
      inbound: {
        count: parseInt(inboundStats.inboundCount || 0),
        quantity: parseInt(inboundStats.inboundQty || 0),
        amount: parseFloat(inboundStats.inboundAmount || 0),
      },
      outbound: {
        count: parseInt(outboundStats.outboundCount || 0),
        quantity: parseInt(outboundStats.outboundQty || 0),
        amount: parseFloat(outboundStats.outboundAmount || 0),
      },
      dailyTrend,
    });
  }
}
