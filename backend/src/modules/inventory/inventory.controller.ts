import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  StockInDto,
  StockOutDto,
  ScanStockOutDto,
  StockAdjustDto,
  QueryInventoryDto,
} from './dto/inventory.dto';

@ApiTags('库存管理')
@Controller('inventory')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('stock-in')
  @ApiOperation({ summary: '采购入库' })
  async stockIn(@Body() dto: StockInDto) {
    return this.inventoryService.stockIn(dto);
  }

  @Post('stock-out')
  @ApiOperation({ summary: '维修领料出库' })
  async stockOut(@Body() dto: StockOutDto) {
    return this.inventoryService.stockOut(dto);
  }

  @Post('scan-stock-out')
  @ApiOperation({ summary: '扫码出库(维修工扫码领件)' })
  async scanStockOut(@Body() dto: ScanStockOutDto) {
    return this.inventoryService.scanStockOut(dto);
  }

  @Post('adjust')
  @ApiOperation({ summary: '库存盘点调整' })
  async stockAdjust(@Body() dto: StockAdjustDto) {
    return this.inventoryService.stockAdjust(dto);
  }

  @Get('spare-part/:sparePartId')
  @ApiOperation({ summary: '获取单个备件的库存信息' })
  async getInventory(@Param('sparePartId') sparePartId: string) {
    return this.inventoryService.getInventory(sparePartId);
  }

  @Get('list')
  @ApiOperation({ summary: '分页查询库存列表' })
  async getAllInventory(@Query() dto: QueryInventoryDto) {
    return this.inventoryService.getAllInventory(dto);
  }

  @Get('low-stock')
  @ApiOperation({ summary: '获取低于安全库存的清单' })
  async getLowStockList() {
    return this.inventoryService.getLowStockList();
  }

  @Get('stats')
  @ApiOperation({ summary: '获取库存统计概览' })
  async getInventoryStats() {
    return this.inventoryService.getInventoryStats();
  }
}
