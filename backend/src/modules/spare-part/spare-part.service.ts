import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { SparePart, SparePartStatus } from './entities/spare-part.entity';
import { SparePartEquipment } from './entities/spare-part-equipment.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import {
  CreateSparePartDto,
  UpdateSparePartDto,
  QuerySparePartDto,
  LinkEquipmentDto,
} from './dto/spare-part.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { generateSparePartCode } from '../../common/utils/order.utils';
import { InventoryCacheService } from '../../redis/inventory-cache.service';

@Injectable()
export class SparePartService {
  private readonly logger = new Logger(SparePartService.name);

  constructor(
    @InjectRepository(SparePart)
    private readonly sparePartRepository: Repository<SparePart>,
    @InjectRepository(SparePartEquipment)
    private readonly sparePartEquipmentRepository: Repository<SparePartEquipment>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly inventoryCacheService: InventoryCacheService,
  ) {}

  async create(dto: CreateSparePartDto): Promise<ApiResponse<SparePart>> {
    const code = generateSparePartCode(dto.category);

    const sparePart = this.sparePartRepository.create({
      ...dto,
      code,
      barcode: code,
    });

    const saved = await this.sparePartRepository.save(sparePart);

    const inventory = this.inventoryRepository.create({
      sparePartId: saved.id,
      currentStock: 0,
    });
    await this.inventoryRepository.save(inventory);

    if (dto.isHot) {
      await this.inventoryCacheService.markAsHotPart(saved.id);
    }

    return ApiResponse.success(saved, '创建备件成功');
  }

  async update(id: string, dto: UpdateSparePartDto): Promise<ApiResponse<SparePart>> {
    const sparePart = await this.sparePartRepository.findOne({ where: { id } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }

    const wasHot = sparePart.isHot;

    Object.assign(sparePart, dto);
    const updated = await this.sparePartRepository.save(sparePart);

    if (dto.isHot !== undefined && dto.isHot !== wasHot) {
      if (dto.isHot) {
        await this.inventoryCacheService.markAsHotPart(updated.id);
      } else {
        await this.inventoryCacheService.unmarkAsHotPart(updated.id);
      }
    }

    if (dto.safetyStock !== undefined) {
      await this.inventoryCacheService.updateSafetyStockCache(updated.id, dto.safetyStock);
    }

    return ApiResponse.success(updated, '更新备件成功');
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const sparePart = await this.sparePartRepository.findOne({ where: { id } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }

    await this.sparePartRepository.softDelete(id);
    await this.inventoryCacheService.unmarkAsHotPart(id);

    return ApiResponse.success(null, '删除备件成功');
  }

  async findById(id: string): Promise<ApiResponse<any>> {
    const sparePart = await this.sparePartRepository
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.equipmentRelations', 'spe')
      .leftJoinAndSelect('spe.equipment', 'eq')
      .leftJoin(Inventory, 'inv', 'inv.sparePartId = sp.id')
      .addSelect(['inv.currentStock', 'inv.totalInbound', 'inv.totalOutbound', 'inv.inventoryValue'])
      .where('sp.id = :id', { id })
      .getOne();

    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }

    const inventory = await this.inventoryRepository.findOne({ where: { sparePartId: id } });

    return ApiResponse.success({
      ...sparePart,
      inventory,
    });
  }

  async findByCode(code: string): Promise<ApiResponse<SparePart>> {
    const sparePart = await this.sparePartRepository.findOne({ where: { code } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }
    return ApiResponse.success(sparePart);
  }

  async findByBarcode(barcode: string): Promise<ApiResponse<SparePart>> {
    const sparePart = await this.sparePartRepository.findOne({ where: { barcode } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }
    return ApiResponse.success(sparePart);
  }

  async findAll(dto: QuerySparePartDto): Promise<ApiResponse<PaginatedResponse<any>>> {
    const { page = 1, pageSize = 20, keyword, category, status, isHot, equipmentId } = dto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.sparePartRepository
      .createQueryBuilder('sp')
      .leftJoin(Inventory, 'inv', 'inv.sparePartId = sp.id')
      .addSelect(['inv.currentStock', 'inv.lastInboundAt', 'inv.lastOutboundAt']);

    if (keyword) {
      queryBuilder.andWhere('(sp.name LIKE :keyword OR sp.code LIKE :keyword OR sp.specification LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (category) {
      queryBuilder.andWhere('sp.category = :category', { category });
    }

    if (status) {
      queryBuilder.andWhere('sp.status = :status', { status });
    }

    if (isHot !== undefined) {
      queryBuilder.andWhere('sp.isHot = :isHot', { isHot });
    }

    if (equipmentId) {
      queryBuilder
        .innerJoin('sp.equipmentRelations', 'spe')
        .andWhere('spe.equipmentId = :equipmentId', { equipmentId });
    }

    const [entities, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('sp.createdAt', 'DESC')
      .getManyAndCount();

    const items = entities.map((entity: any) => ({
      ...entity,
      currentStock: entity.inventory?.currentStock ?? 0,
      safetyStock: entity.safetyStock ?? 0,
    }));

    return ApiResponse.success({
      list: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  async linkEquipment(sparePartId: string, dto: LinkEquipmentDto): Promise<ApiResponse<null>> {
    const sparePart = await this.sparePartRepository.findOne({ where: { id: sparePartId } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }

    for (const equipmentId of dto.equipmentIds) {
      const exists = await this.sparePartEquipmentRepository.findOne({
        where: { sparePartId, equipmentId },
      });

      if (!exists) {
        const relation = this.sparePartEquipmentRepository.create({
          sparePartId,
          equipmentId,
          installPosition: dto.installPosition,
          usagePerEquipment: dto.usagePerEquipment || 1,
        });
        await this.sparePartEquipmentRepository.save(relation);
      }
    }

    return ApiResponse.success(null, '关联设备成功');
  }

  async unlinkEquipment(sparePartId: string, equipmentId: string): Promise<ApiResponse<null>> {
    await this.sparePartEquipmentRepository.delete({ sparePartId, equipmentId });
    return ApiResponse.success(null, '取消关联成功');
  }

  async getLinkedEquipments(sparePartId: string): Promise<ApiResponse<any[]>> {
    const relations = await this.sparePartEquipmentRepository
      .createQueryBuilder('spe')
      .innerJoinAndSelect('spe.equipment', 'eq')
      .where('spe.sparePartId = :sparePartId', { sparePartId })
      .getMany();

    return ApiResponse.success(relations);
  }

  async toggleHot(id: string): Promise<ApiResponse<SparePart>> {
    const sparePart = await this.sparePartRepository.findOne({ where: { id } });
    if (!sparePart) {
      throw new NotFoundException('备件不存在');
    }

    sparePart.isHot = !sparePart.isHot;
    const updated = await this.sparePartRepository.save(sparePart);

    if (sparePart.isHot) {
      await this.inventoryCacheService.markAsHotPart(id);
    } else {
      await this.inventoryCacheService.unmarkAsHotPart(id);
    }

    return ApiResponse.success(updated, sparePart.isHot ? '已标记为常用备件' : '已取消常用备件标记');
  }
}
