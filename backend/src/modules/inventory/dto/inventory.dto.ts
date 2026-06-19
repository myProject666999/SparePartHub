import { IsOptional, IsString, IsNumber, Min, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/response.dto';

export class StockInDto {
  @ApiProperty({ description: '备件ID' })
  @IsString()
  sparePartId: string;

  @ApiProperty({ description: '入库数量' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: '采购单号' })
  @IsString()
  @IsOptional()
  relatedOrderNo?: string;

  @ApiPropertyOptional({ description: '供应商名称' })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiPropertyOptional({ description: '入库经办人' })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({ description: '单价' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class StockOutDto {
  @ApiProperty({ description: '备件ID' })
  @IsString()
  sparePartId: string;

  @ApiProperty({ description: '出库数量' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '关联设备ID' })
  @IsString()
  equipmentId: string;

  @ApiPropertyOptional({ description: '关联维修记录ID' })
  @IsString()
  @IsOptional()
  maintenanceRecordId?: string;

  @ApiPropertyOptional({ description: '领料人' })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({ description: '领用部门' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class ScanStockOutDto {
  @ApiProperty({ description: '备件条码' })
  @IsString()
  barcode: string;

  @ApiProperty({ description: '出库数量' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '设备编码' })
  @IsString()
  equipmentCode: string;

  @ApiPropertyOptional({ description: '维修单号' })
  @IsString()
  @IsOptional()
  maintenanceOrderNo?: string;

  @ApiPropertyOptional({ description: '领料人' })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class StockAdjustDto {
  @ApiProperty({ description: '备件ID' })
  @IsString()
  sparePartId: string;

  @ApiProperty({ description: '调整后实际库存' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualStock: number;

  @ApiPropertyOptional({ description: '盘点人' })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({ description: '调整原因' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryInventoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '是否只查低于安全库存' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  onlyLowStock?: boolean;

  @ApiPropertyOptional({ description: '是否只查常用备件' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  onlyHot?: boolean;

  @ApiPropertyOptional({ description: '备件分类' })
  @IsString()
  @IsOptional()
  category?: string;
}

export class QueryStockMovementDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '备件ID' })
  @IsString()
  @IsOptional()
  sparePartId?: string;

  @ApiPropertyOptional({ description: '设备ID' })
  @IsString()
  @IsOptional()
  equipmentId?: string;

  @ApiPropertyOptional({ description: '出入库类型' })
  @IsString()
  @IsOptional()
  movementType?: string;

  @ApiPropertyOptional({ description: '开始日期 YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期 YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '经办人' })
  @IsString()
  @IsOptional()
  operator?: string;
}
