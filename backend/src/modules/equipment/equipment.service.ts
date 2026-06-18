import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Equipment, EquipmentStatus } from './entities/equipment.entity';
import { SparePartEquipment } from '../spare-part/entities/spare-part-equipment.entity';
import { CreateEquipmentDto, UpdateEquipmentDto, QueryEquipmentDto } from './dto/equipment.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { generateEquipmentCode } from '../../common/utils/order.utils';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(SparePartEquipment)
    private readonly sparePartEquipmentRepository: Repository<SparePartEquipment>,
  ) {}

  async create(dto: CreateEquipmentDto): Promise<ApiResponse<Equipment>> {
    const code = generateEquipmentCode(dto.category || 'EQ');

    const equipment = this.equipmentRepository.create({
      ...dto,
      code,
    });

    const saved = await this.equipmentRepository.save(equipment);
    return ApiResponse.success(saved, '创建设备成功');
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<ApiResponse<Equipment>> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('设备不存在');
    }

    Object.assign(equipment, dto);
    const updated = await this.equipmentRepository.save(equipment);
    return ApiResponse.success(updated, '更新设备成功');
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('设备不存在');
    }

    await this.equipmentRepository.softDelete(id);
    return ApiResponse.success(null, '删除设备成功');
  }

  async findById(id: string): Promise<ApiResponse<any>> {
    const equipment = await this.equipmentRepository
      .createQueryBuilder('eq')
      .leftJoinAndSelect('eq.sparePartRelations', 'spe')
      .leftJoinAndSelect('spe.sparePart', 'sp')
      .where('eq.id = :id', { id })
      .getOne();

    if (!equipment) {
      throw new NotFoundException('设备不存在');
    }

    return ApiResponse.success(equipment);
  }

  async findAll(dto: QueryEquipmentDto): Promise<ApiResponse<PaginatedResponse<Equipment>>> {
    const { page = 1, pageSize = 20, keyword, category, workshop, status, sparePartId } = dto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.equipmentRepository.createQueryBuilder('eq');

    if (keyword) {
      queryBuilder.andWhere(
        '(eq.name LIKE :keyword OR eq.code LIKE :keyword OR eq.model LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('eq.category = :category', { category });
    }

    if (workshop) {
      queryBuilder.andWhere('eq.workshop = :workshop', { workshop });
    }

    if (status) {
      queryBuilder.andWhere('eq.status = :status', { status });
    }

    if (sparePartId) {
      queryBuilder
        .innerJoin('eq.sparePartRelations', 'spe')
        .andWhere('spe.sparePartId = :sparePartId', { sparePartId });
    }

    const [list, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('eq.createdAt', 'DESC')
      .getManyAndCount();

    return ApiResponse.success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  async findByCode(code: string): Promise<ApiResponse<Equipment>> {
    const equipment = await this.equipmentRepository.findOne({ where: { code } });
    if (!equipment) {
      throw new NotFoundException('设备不存在');
    }
    return ApiResponse.success(equipment);
  }

  async updateStatus(id: string, status: EquipmentStatus): Promise<ApiResponse<Equipment>> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('设备不存在');
    }

    equipment.status = status;
    const updated = await this.equipmentRepository.save(equipment);
    return ApiResponse.success(updated, '状态更新成功');
  }

  async getAllSimple(): Promise<ApiResponse<any[]>> {
    const equipments = await this.equipmentRepository
      .createQueryBuilder('eq')
      .select(['eq.id', 'eq.code', 'eq.name', 'eq.workshop', 'eq.status'])
      .where('eq.status != :status', { status: EquipmentStatus.SCRAPPED })
      .orderBy('eq.workshop', 'ASC')
      .addOrderBy('eq.code', 'ASC')
      .getMany();

    return ApiResponse.success(equipments);
  }
}
