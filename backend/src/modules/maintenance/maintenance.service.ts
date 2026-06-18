import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { MaintenanceRecord, MaintenanceType, MaintenanceStatus } from './entities/maintenance-record.entity';
import { Equipment, EquipmentStatus } from '../equipment/entities/equipment.entity';
import { StockMovement } from '../stock-movement/entities/stock-movement.entity';
import {
  CreateMaintenanceRecordDto,
  UpdateMaintenanceRecordDto,
  QueryMaintenanceRecordDto,
} from './dto/maintenance-record.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { generateOrderNo } from '../../common/utils/order.utils';
import * as dayjs from 'dayjs';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRecordRepository: Repository<MaintenanceRecord>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateMaintenanceRecordDto): Promise<ApiResponse<MaintenanceRecord>> {
    const equipment = await this.equipmentRepository.findOne({ where: { id: dto.equipmentId } });
    if (!equipment) {
      throw new NotFoundException('设备不存在');
    }

    const orderNo = generateOrderNo('WX');

    const record = this.maintenanceRecordRepository.create({
      ...dto,
      orderNo,
      faultTime: dto.faultTime ? dayjs(dto.faultTime).toDate() : new Date(),
      startTime: new Date(),
    });

    const saved = await this.maintenanceRecordRepository.save(record);

    await this.equipmentRepository
      .createQueryBuilder()
      .update(Equipment)
      .set({
        status: EquipmentStatus.MAINTENANCE,
      })
      .where('id = :id', { id: dto.equipmentId })
      .execute();

    return ApiResponse.success(saved, '创建维修记录成功');
  }

  async update(id: string, dto: UpdateMaintenanceRecordDto): Promise<ApiResponse<MaintenanceRecord>> {
    const record = await this.maintenanceRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('维修记录不存在');
    }

    const updateData: any = { ...dto };

    if (dto.startTime) {
      updateData.startTime = dayjs(dto.startTime).toDate();
    }
    if (dto.endTime) {
      updateData.endTime = dayjs(dto.endTime).toDate();
    }

    if (dto.status === MaintenanceStatus.COMPLETED && !record.endTime) {
      updateData.endTime = new Date();
    }

    if (updateData.startTime && updateData.endTime) {
      const diff = dayjs(updateData.endTime).diff(dayjs(updateData.startTime), 'minute');
      if (!updateData.downtimeMinutes) {
        updateData.downtimeMinutes = diff;
      }
    }

    if (dto.laborCost !== undefined) {
      updateData.totalCost = (record.sparePartCost || 0) + (dto.laborCost || 0);
    }

    Object.assign(record, updateData);
    const updated = await this.maintenanceRecordRepository.save(record);

    if (dto.status === MaintenanceStatus.COMPLETED) {
      await this.equipmentRepository
        .createQueryBuilder()
        .update(Equipment)
        .set({ maintenanceCount: () => 'maintenanceCount + 1', status: EquipmentStatus.RUNNING })
        .where('id = :id', { id: record.equipmentId })
        .execute();
    }

    return ApiResponse.success(updated, '更新维修记录成功');
  }

  async findById(id: string): Promise<ApiResponse<any>> {
    const record = await this.maintenanceRecordRepository
      .createQueryBuilder('mr')
      .leftJoinAndSelect('mr.equipment', 'eq')
      .where('mr.id = :id', { id })
      .getOne();

    if (!record) {
      throw new NotFoundException('维修记录不存在');
    }

    const stockMovements = await this.stockMovementRepository.find({
      where: { maintenanceRecordId: id },
      relations: ['sparePart'],
    });

    return ApiResponse.success({
      ...record,
      stockMovements,
    });
  }

  async findAll(dto: QueryMaintenanceRecordDto): Promise<ApiResponse<PaginatedResponse<any>>> {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      equipmentId,
      maintenanceType,
      status,
      startDate,
      endDate,
      maintainer,
    } = dto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.maintenanceRecordRepository
      .createQueryBuilder('mr')
      .leftJoinAndSelect('mr.equipment', 'eq');

    if (keyword) {
      queryBuilder.andWhere(
        '(mr.orderNo LIKE :keyword OR eq.name LIKE :keyword OR eq.code LIKE :keyword OR mr.faultDescription LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (equipmentId) {
      queryBuilder.andWhere('mr.equipmentId = :equipmentId', { equipmentId });
    }

    if (maintenanceType) {
      queryBuilder.andWhere('mr.maintenanceType = :maintenanceType', { maintenanceType });
    }

    if (status) {
      queryBuilder.andWhere('mr.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('mr.createdAt >= :startDate', { startDate: dayjs(startDate).startOf('day').toDate() });
    }

    if (endDate) {
      queryBuilder.andWhere('mr.createdAt <= :endDate', { endDate: dayjs(endDate).endOf('day').toDate() });
    }

    if (maintainer) {
      queryBuilder.andWhere('mr.maintainer LIKE :maintainer', { maintainer: `%${maintainer}%` });
    }

    const [list, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('mr.createdAt', 'DESC')
      .getManyAndCount();

    return ApiResponse.success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  async getByOrderNo(orderNo: string): Promise<ApiResponse<any>> {
    const record = await this.maintenanceRecordRepository
      .createQueryBuilder('mr')
      .leftJoinAndSelect('mr.equipment', 'eq')
      .where('mr.orderNo = :orderNo', { orderNo })
      .getOne();

    return ApiResponse.success(record);
  }

  async getMaintenanceStats(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').startOf('day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : new Date();

    const totalCount = await this.maintenanceRecordRepository.count({
      where: { createdAt: Between(start, end) },
    });

    const completedCount = await this.maintenanceRecordRepository.count({
      where: { status: MaintenanceStatus.COMPLETED, createdAt: Between(start, end) },
    });

    const typeStats = await this.maintenanceRecordRepository
      .createQueryBuilder('mr')
      .select('mr.maintenanceType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('mr.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('mr.maintenanceType')
      .getRawMany();

    const costStats = await this.maintenanceRecordRepository
      .createQueryBuilder('mr')
      .select('COALESCE(SUM(mr.sparePartCost), 0)', 'sparePartCost')
      .addSelect('COALESCE(SUM(mr.laborCost), 0)', 'laborCost')
      .addSelect('COALESCE(SUM(mr.totalCost), 0)', 'totalCost')
      .addSelect('COALESCE(SUM(mr.downtimeMinutes), 0)', 'totalDowntime')
      .where('mr.status = :status AND mr.createdAt BETWEEN :start AND :end', {
        status: MaintenanceStatus.COMPLETED,
        start,
        end,
      })
      .getRawOne();

    return ApiResponse.success({
      period: { start: dayjs(start).format('YYYY-MM-DD'), end: dayjs(end).format('YYYY-MM-DD') },
      totalCount,
      completedCount,
      completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      typeStats,
      cost: {
        sparePartCost: parseFloat(costStats.sparePartCost || 0),
        laborCost: parseFloat(costStats.laborCost || 0),
        totalCost: parseFloat(costStats.totalCost || 0),
        totalDowntime: parseInt(costStats.totalDowntime || 0),
      },
    });
  }
}
