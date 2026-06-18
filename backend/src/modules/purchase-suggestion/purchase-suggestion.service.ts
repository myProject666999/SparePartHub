import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { PurchaseSuggestion, PurchaseSuggestionStatus } from './entities/purchase-suggestion.entity';
import { SparePart } from '../spare-part/entities/spare-part.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import {
  GeneratePurchaseSuggestionDto,
  ApprovePurchaseSuggestionDto,
  LinkPurchaseOrderDto,
  QueryPurchaseSuggestionDto,
} from './dto/purchase-suggestion.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { generateOrderNo } from '../../common/utils/order.utils';
import { InventoryCacheService } from '../../redis/inventory-cache.service';
import * as dayjs from 'dayjs';

@Injectable()
export class PurchaseSuggestionService {
  private readonly logger = new Logger(PurchaseSuggestionService.name);

  constructor(
    @InjectRepository(PurchaseSuggestion)
    private readonly purchaseSuggestionRepository: Repository<PurchaseSuggestion>,
    @InjectRepository(SparePart)
    private readonly sparePartRepository: Repository<SparePart>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly inventoryCacheService: InventoryCacheService,
  ) {}

  async generateSuggestions(dto: GeneratePurchaseSuggestionDto): Promise<ApiResponse<PurchaseSuggestion[]>> {
    const suggestions: PurchaseSuggestion[] = [];

    let lowStockItems = await this.inventoryCacheService.checkLowStock();

    const dbLowStock = await this.inventoryRepository
      .createQueryBuilder('inv')
      .innerJoinAndSelect('inv.sparePart', 'sp')
      .where('inv.currentStock <= sp.safetyStock');

    if (dto.category) {
      dbLowStock.andWhere('sp.category = :category', { category: dto.category });
    }

    if (dto.isHot) {
      dbLowStock.andWhere('sp.isHot = :isHot', { isHot: true });
    }

    const dbItems = await dbLowStock.getMany();

    const allLowStock = new Map<string, any>();

    for (const item of lowStockItems) {
      const sp = await this.sparePartRepository.findOne({ where: { id: item.sparePartId } });
      if (sp && (!dto.category || sp.category === dto.category)) {
        allLowStock.set(item.sparePartId, {
          sparePartId: item.sparePartId,
          currentStock: item.currentStock,
          safetyStock: item.safetyStock,
          sparePart: sp,
        });
      }
    }

    for (const item of dbItems) {
      if (!allLowStock.has(item.sparePartId)) {
        allLowStock.set(item.sparePartId, {
          sparePartId: item.sparePartId,
          currentStock: item.currentStock,
          safetyStock: item.sparePart.safetyStock,
          sparePart: item.sparePart,
          inventory: item,
        });
      }
    }

    const existingPending = await this.purchaseSuggestionRepository.find({
      where: { status: In([PurchaseSuggestionStatus.PENDING, PurchaseSuggestionStatus.APPROVED, PurchaseSuggestionStatus.ORDERED]) },
    });
    const existingSparePartIds = new Set(existingPending.map((s) => s.sparePartId));

    for (const [sparePartId, data] of allLowStock.entries()) {
      if (existingSparePartIds.has(sparePartId)) {
        continue;
      }

      const gap = data.safetyStock - data.currentStock;
      if (gap <= 0) continue;

      const suggestedQuantity = Math.max(gap * 2, data.sparePart.purchaseQuantity || 10);
      const monthlyConsumption = data.inventory?.monthlyConsumption || 0;
      const estimatedDaysLeft =
        monthlyConsumption > 0 ? Math.round((data.currentStock / monthlyConsumption) * 30) : null;

      const isUrgent =
        data.currentStock === 0 ||
        (estimatedDaysLeft !== null && estimatedDaysLeft <= 7);

      const suggestion = this.purchaseSuggestionRepository.create({
        suggestionNo: generateOrderNo('QG'),
        sparePartId,
        currentStock: data.currentStock,
        safetyStock: data.safetyStock,
        suggestedQuantity,
        gapQuantity: gap,
        monthlyConsumption,
        estimatedDaysLeft,
        isUrgent,
      });

      const saved = await this.purchaseSuggestionRepository.save(suggestion);
      suggestions.push(saved);

      this.logger.log(
        `生成请购建议: ${data.sparePart.code}[${data.sparePart.name}] 库存:${data.currentStock} 安全库存:${data.safetyStock} 缺口:${gap} 建议采购:${suggestedQuantity}${isUrgent ? ' [紧急]' : ''}`,
      );
    }

    this.logger.log(`本次共生成 ${suggestions.length} 条请购建议`);
    return ApiResponse.success(suggestions, `生成${suggestions.length}条请购建议成功`);
  }

  async findAll(dto: QueryPurchaseSuggestionDto): Promise<ApiResponse<PaginatedResponse<any>>> {
    const { page = 1, pageSize = 20, keyword, status, isUrgent, startDate, endDate } = dto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.purchaseSuggestionRepository
      .createQueryBuilder('ps')
      .innerJoinAndMapOne('ps.sparePart', SparePart, 'sp', 'sp.id = ps.sparePartId');

    if (keyword) {
      queryBuilder.andWhere('(ps.suggestionNo LIKE :keyword OR sp.name LIKE :keyword OR sp.code LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('ps.status = :status', { status });
    }

    if (isUrgent !== undefined) {
      queryBuilder.andWhere('ps.isUrgent = :isUrgent', { isUrgent });
    }

    if (startDate) {
      queryBuilder.andWhere('ps.createdAt >= :startDate', {
        startDate: dayjs(startDate).startOf('day').toDate(),
      });
    }

    if (endDate) {
      queryBuilder.andWhere('ps.createdAt <= :endDate', {
        endDate: dayjs(endDate).endOf('day').toDate(),
      });
    }

    const [list, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('ps.isUrgent', 'DESC')
      .addOrderBy('ps.createdAt', 'DESC')
      .getManyAndCount();

    return ApiResponse.success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  async findById(id: string): Promise<ApiResponse<any>> {
    const suggestion = await this.purchaseSuggestionRepository
      .createQueryBuilder('ps')
      .innerJoinAndMapOne('ps.sparePart', SparePart, 'sp', 'sp.id = ps.sparePartId')
      .where('ps.id = :id', { id })
      .getOne();

    if (!suggestion) {
      throw new NotFoundException('请购建议不存在');
    }

    return ApiResponse.success(suggestion);
  }

  async approve(id: string, dto: ApprovePurchaseSuggestionDto): Promise<ApiResponse<PurchaseSuggestion>> {
    const suggestion = await this.purchaseSuggestionRepository.findOne({ where: { id } });
    if (!suggestion) {
      throw new NotFoundException('请购建议不存在');
    }

    if (suggestion.status !== PurchaseSuggestionStatus.PENDING) {
      throw new BadRequestException('当前状态不允许审批');
    }

    suggestion.status = dto.status;
    suggestion.approver = dto.approver || 'system';
    suggestion.approvalTime = new Date();
    suggestion.approvalRemark = dto.approvalRemark;

    const updated = await this.purchaseSuggestionRepository.save(suggestion);
    return ApiResponse.success(
      updated,
      dto.status === PurchaseSuggestionStatus.APPROVED ? '审批通过' : '已驳回',
    );
  }

  async linkPurchaseOrder(id: string, dto: LinkPurchaseOrderDto): Promise<ApiResponse<PurchaseSuggestion>> {
    const suggestion = await this.purchaseSuggestionRepository.findOne({ where: { id } });
    if (!suggestion) {
      throw new NotFoundException('请购建议不存在');
    }

    if (suggestion.status !== PurchaseSuggestionStatus.APPROVED) {
      throw new BadRequestException('只有审批通过的请购单才能关联采购单');
    }

    suggestion.status = PurchaseSuggestionStatus.ORDERED;
    suggestion.purchaseOrderNo = dto.purchaseOrderNo;
    suggestion.orderedQuantity = dto.orderedQuantity;
    if (dto.expectedDeliveryDate) {
      suggestion.expectedDeliveryDate = dayjs(dto.expectedDeliveryDate).toDate();
    }

    const updated = await this.purchaseSuggestionRepository.save(suggestion);
    return ApiResponse.success(updated, '关联采购单成功');
  }

  async markCompleted(id: string): Promise<ApiResponse<PurchaseSuggestion>> {
    const suggestion = await this.purchaseSuggestionRepository.findOne({ where: { id } });
    if (!suggestion) {
      throw new NotFoundException('请购建议不存在');
    }

    suggestion.status = PurchaseSuggestionStatus.COMPLETED;
    const updated = await this.purchaseSuggestionRepository.save(suggestion);
    return ApiResponse.success(updated, '请购单已完成');
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const suggestion = await this.purchaseSuggestionRepository.findOne({ where: { id } });
    if (!suggestion) {
      throw new NotFoundException('请购建议不存在');
    }

    if (
      [
        PurchaseSuggestionStatus.APPROVED,
        PurchaseSuggestionStatus.ORDERED,
        PurchaseSuggestionStatus.COMPLETED,
      ].includes(suggestion.status)
    ) {
      throw new BadRequestException('已处理的请购单不能删除');
    }

    await this.purchaseSuggestionRepository.delete(id);
    return ApiResponse.success(null, '删除请购建议成功');
  }

  async getStats(): Promise<ApiResponse<any>> {
    const pendingCount = await this.purchaseSuggestionRepository.count({
      where: { status: PurchaseSuggestionStatus.PENDING },
    });
    const approvedCount = await this.purchaseSuggestionRepository.count({
      where: { status: PurchaseSuggestionStatus.APPROVED },
    });
    const orderedCount = await this.purchaseSuggestionRepository.count({
      where: { status: PurchaseSuggestionStatus.ORDERED },
    });
    const urgentCount = await this.purchaseSuggestionRepository.count({
      where: { isUrgent: true, status: In([PurchaseSuggestionStatus.PENDING, PurchaseSuggestionStatus.APPROVED]) },
    });

    const totalSuggestedQty = await this.purchaseSuggestionRepository
      .createQueryBuilder('ps')
      .select('COALESCE(SUM(ps.suggestedQuantity), 0)', 'total')
      .where('ps.status IN (:...statuses)', {
        statuses: [
          PurchaseSuggestionStatus.PENDING,
          PurchaseSuggestionStatus.APPROVED,
          PurchaseSuggestionStatus.ORDERED,
        ],
      })
      .getRawOne();

    return ApiResponse.success({
      pendingCount,
      approvedCount,
      orderedCount,
      urgentCount,
      totalSuggestedQuantity: parseInt(totalSuggestedQty.total || 0),
    });
  }
}
