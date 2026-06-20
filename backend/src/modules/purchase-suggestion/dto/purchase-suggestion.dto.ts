import { IsOptional, IsString, IsEnum, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PurchaseSuggestionStatus } from '../entities/purchase-suggestion.entity';
import { PaginationQueryDto } from '../../../common/dto/response.dto';

export class GeneratePurchaseSuggestionDto {
  @ApiPropertyOptional({ description: '只生成常用备件的请购建议' })
  isHot?: boolean;

  @ApiPropertyOptional({ description: '指定备件分类' })
  @IsString()
  @IsOptional()
  category?: string;
}

export class ApprovePurchaseSuggestionDto {
  @ApiProperty({ description: '审批意见', enum: PurchaseSuggestionStatus })
  @IsEnum([PurchaseSuggestionStatus.APPROVED, PurchaseSuggestionStatus.REJECTED])
  status: PurchaseSuggestionStatus.APPROVED | PurchaseSuggestionStatus.REJECTED;

  @ApiPropertyOptional({ description: '审批人' })
  @IsString()
  @IsOptional()
  approver?: string;

  @ApiPropertyOptional({ description: '审批备注' })
  @IsString()
  @IsOptional()
  approvalRemark?: string;
}

export class LinkPurchaseOrderDto {
  @ApiProperty({ description: '采购单号' })
  @IsString()
  purchaseOrderNo: string;

  @ApiPropertyOptional({ description: '预计到货日期' })
  @IsString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @ApiProperty({ description: '采购数量' })
  @IsNumber()
  @Min(1)
  orderedQuantity: number;
}

export class QueryPurchaseSuggestionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '请购状态', enum: PurchaseSuggestionStatus })
  @Transform(({ value }) => (value === '' || value === undefined) ? undefined : value)
  @IsEnum(PurchaseSuggestionStatus)
  @IsOptional()
  status?: PurchaseSuggestionStatus;

  @ApiPropertyOptional({ description: '是否紧急' })
  @Transform(({ value }) => (value === '' || value === undefined) ? undefined : value)
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: '开始日期 YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期 YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  endDate?: string;
}
