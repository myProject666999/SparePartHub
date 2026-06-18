import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SparePartService } from './spare-part.service';
import {
  CreateSparePartDto,
  UpdateSparePartDto,
  QuerySparePartDto,
  LinkEquipmentDto,
} from './dto/spare-part.dto';
import { ApiResponse as ApiResp } from '../../common/dto/response.dto';

@ApiTags('备件管理')
@Controller('spare-parts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SparePartController {
  constructor(private readonly sparePartService: SparePartService) {}

  @Post()
  @ApiOperation({ summary: '创建备件' })
  async create(@Body() dto: CreateSparePartDto) {
    return this.sparePartService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新备件' })
  async update(@Param('id') id: string, @Body() dto: UpdateSparePartDto) {
    return this.sparePartService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除备件' })
  async delete(@Param('id') id: string) {
    return this.sparePartService.delete(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取备件详情' })
  async findById(@Param('id') id: string) {
    return this.sparePartService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: '根据编码获取备件' })
  async findByCode(@Param('code') code: string) {
    return this.sparePartService.findByCode(code);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: '扫码获取备件信息' })
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.sparePartService.findByBarcode(barcode);
  }

  @Get()
  @ApiOperation({ summary: '分页查询备件列表' })
  async findAll(@Query() dto: QuerySparePartDto) {
    return this.sparePartService.findAll(dto);
  }

  @Post(':id/link-equipment')
  @ApiOperation({ summary: '关联可用设备' })
  async linkEquipment(@Param('id') id: string, @Body() dto: LinkEquipmentDto) {
    return this.sparePartService.linkEquipment(id, dto);
  }

  @Delete(':id/link-equipment/:equipmentId')
  @ApiOperation({ summary: '取消设备关联' })
  async unlinkEquipment(
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
  ) {
    return this.sparePartService.unlinkEquipment(id, equipmentId);
  }

  @Get(':id/linked-equipments')
  @ApiOperation({ summary: '获取关联的设备列表' })
  async getLinkedEquipments(@Param('id') id: string) {
    return this.sparePartService.getLinkedEquipments(id);
  }

  @Put(':id/toggle-hot')
  @ApiOperation({ summary: '切换常用备件标记' })
  async toggleHot(@Param('id') id: string) {
    return this.sparePartService.toggleHot(id);
  }
}
