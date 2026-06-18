import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockMovementService } from './stock-movement.service';
import { QueryStockMovementDto } from '../inventory/dto/inventory.dto';

@ApiTags('出入库流水')
@Controller('stock-movements')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Get()
  @ApiOperation({ summary: '分页查询出入库流水' })
  async findAll(@Query() dto: QueryStockMovementDto) {
    return this.stockMovementService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取流水详情' })
  async findById(@Param('id') id: string) {
    return this.stockMovementService.findById(id);
  }

  @Get('order/:orderNo')
  @ApiOperation({ summary: '根据单号查询流水' })
  async findByOrderNo(@Param('orderNo') orderNo: string) {
    return this.stockMovementService.findByOrderNo(orderNo);
  }

  @Get('trace/:sparePartId')
  @ApiOperation({ summary: '查询某备件的出入库追溯记录' })
  async getTraceList(@Param('sparePartId') sparePartId: string) {
    return this.stockMovementService.getTraceList(sparePartId);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: '出入库统计汇总' })
  async getMovementStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.stockMovementService.getMovementStats(startDate, endDate);
  }
}
