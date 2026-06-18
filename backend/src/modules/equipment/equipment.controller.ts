import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto, UpdateEquipmentDto, QueryEquipmentDto } from './dto/equipment.dto';
import { EquipmentStatus } from './entities/equipment.entity';

@ApiTags('设备管理')
@Controller('equipments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: '创建设备' })
  async create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新设备' })
  async update(@Param('id') id: string, @Body() dto: UpdateEquipmentDto) {
    return this.equipmentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除设备' })
  async delete(@Param('id') id: string) {
    return this.equipmentService.delete(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取设备详情' })
  async findById(@Param('id') id: string) {
    return this.equipmentService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: '根据编码获取设备' })
  async findByCode(@Param('code') code: string) {
    return this.equipmentService.findByCode(code);
  }

  @Get()
  @ApiOperation({ summary: '分页查询设备列表' })
  async findAll(@Query() dto: QueryEquipmentDto) {
    return this.equipmentService.findAll(dto);
  }

  @Get('simple/all')
  @ApiOperation({ summary: '获取所有设备(简化列表,用于下拉选择)' })
  async getAllSimple() {
    return this.equipmentService.getAllSimple();
  }

  @Put(':id/status/:status')
  @ApiOperation({ summary: '更新设备状态' })
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: EquipmentStatus,
  ) {
    return this.equipmentService.updateStatus(id, status);
  }
}
