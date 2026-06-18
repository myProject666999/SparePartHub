import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceRecordDto,
  UpdateMaintenanceRecordDto,
  QueryMaintenanceRecordDto,
} from './dto/maintenance-record.dto';

@ApiTags('维修记录管理')
@Controller('maintenance-records')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: '创建维修记录' })
  async create(@Body() dto: CreateMaintenanceRecordDto) {
    return this.maintenanceService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新维修记录' })
  async update(@Param('id') id: string, @Body() dto: UpdateMaintenanceRecordDto) {
    return this.maintenanceService.update(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取维修记录详情(含备件消耗)' })
  async findById(@Param('id') id: string) {
    return this.maintenanceService.findById(id);
  }

  @Get('order/:orderNo')
  @ApiOperation({ summary: '根据维修单号查询' })
  async getByOrderNo(@Param('orderNo') orderNo: string) {
    return this.maintenanceService.getByOrderNo(orderNo);
  }

  @Get()
  @ApiOperation({ summary: '分页查询维修记录' })
  async findAll(@Query() dto: QueryMaintenanceRecordDto) {
    return this.maintenanceService.findAll(dto);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: '维修统计汇总' })
  async getMaintenanceStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.maintenanceService.getMaintenanceStats(startDate, endDate);
  }
}
