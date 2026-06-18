import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('统计分析')
@Controller('statistics')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '首页仪表盘统计' })
  async getDashboardStats() {
    return this.statisticsService.getDashboardStats();
  }

  @Get('consumption/equipment')
  @ApiOperation({ summary: '按设备统计备件消耗(TOP排行)' })
  async getConsumptionByEquipment(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('topN') topN?: number,
  ) {
    return this.statisticsService.getConsumptionByEquipment(startDate, endDate, topN ? +topN : 10);
  }

  @Get('consumption/spare-part')
  @ApiOperation({ summary: '按备件统计消耗量(TOP排行)' })
  async getConsumptionBySparePart(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('topN') topN?: number,
  ) {
    return this.statisticsService.getConsumptionBySparePart(startDate, endDate, topN ? +topN : 20);
  }

  @Get('consumption/category')
  @ApiOperation({ summary: '按备件分类统计消耗' })
  async getConsumptionByCategory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getConsumptionByCategory(startDate, endDate);
  }

  @Get('consumption/trend')
  @ApiOperation({ summary: '出入库消耗趋势图数据' })
  async getConsumptionTrend(@Query('days') days?: number) {
    return this.statisticsService.getConsumptionTrend(days ? +days : 30);
  }

  @Get('consumption/equipment/:equipmentId')
  @ApiOperation({ summary: '单台设备的备件消耗明细' })
  async getEquipmentSparePartDetail(
    @Param('equipmentId') equipmentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getEquipmentSparePartDetail(equipmentId, startDate, endDate);
  }
}
