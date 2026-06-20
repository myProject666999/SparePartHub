import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsBoolean, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { SparePartStatus, SparePartCategory } from '../entities/spare-part.entity';
import { PaginationQueryDto } from '../../../common/dto/response.dto';

export class CreateSparePartDto {
  @ApiProperty({ description: '备件名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '备件分类', enum: SparePartCategory })
  @IsEnum(SparePartCategory)
  @IsNotEmpty()
  category: SparePartCategory;

  @ApiProperty({ description: '规格型号' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  specification: string;

  @ApiPropertyOptional({ description: '品牌' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: '生产厂商' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: '单价(元)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: '计量单位' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ description: '存放货位' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  storageLocation: string;

  @ApiProperty({ description: '安全库存下限' })
  @IsNumber()
  @Min(0)
  safetyStock: number;

  @ApiPropertyOptional({ description: '请购推荐数量' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  purchaseQuantity?: number;

  @ApiPropertyOptional({ description: '技术参数' })
  @IsString()
  @IsOptional()
  technicalParams?: string;

  @ApiPropertyOptional({ description: '备注说明' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '是否常用备件' })
  @IsBoolean()
  @IsOptional()
  isHot?: boolean;

  @ApiPropertyOptional({ description: '状态', enum: SparePartStatus })
  @IsEnum(SparePartStatus)
  @IsOptional()
  status?: SparePartStatus;
}

export class UpdateSparePartDto {
  @ApiPropertyOptional({ description: '备件名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '备件分类', enum: SparePartCategory })
  @IsEnum(SparePartCategory)
  @IsOptional()
  category?: SparePartCategory;

  @ApiPropertyOptional({ description: '规格型号' })
  @IsString()
  @IsOptional()
  specification?: string;

  @ApiPropertyOptional({ description: '品牌' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: '生产厂商' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: '单价(元)' })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ description: '计量单位' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: '存放货位' })
  @IsString()
  @IsOptional()
  storageLocation?: string;

  @ApiPropertyOptional({ description: '安全库存下限' })
  @IsNumber()
  @IsOptional()
  safetyStock?: number;

  @ApiPropertyOptional({ description: '请购推荐数量' })
  @IsNumber()
  @IsOptional()
  purchaseQuantity?: number;

  @ApiPropertyOptional({ description: '技术参数' })
  @IsString()
  @IsOptional()
  technicalParams?: string;

  @ApiPropertyOptional({ description: '备注说明' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '是否常用备件' })
  @IsBoolean()
  @IsOptional()
  isHot?: boolean;

  @ApiPropertyOptional({ description: '状态', enum: SparePartStatus })
  @IsEnum(SparePartStatus)
  @IsOptional()
  status?: SparePartStatus;
}

export class QuerySparePartDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '备件分类', enum: SparePartCategory })
  @Transform(({ value }) => (value === '' || value === undefined) ? undefined : value)
  @IsEnum(SparePartCategory)
  @IsOptional()
  category?: SparePartCategory;

  @ApiPropertyOptional({ description: '状态', enum: SparePartStatus })
  @Transform(({ value }) => (value === '' || value === undefined) ? undefined : value)
  @IsEnum(SparePartStatus)
  @IsOptional()
  status?: SparePartStatus;

  @ApiPropertyOptional({ description: '是否常用备件' })
  @Transform(({ value }) => (value === '' || value === undefined) ? undefined : value)
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isHot?: boolean;

  @ApiPropertyOptional({ description: '设备ID(查询该设备可用的备件)' })
  @IsString()
  @IsOptional()
  equipmentId?: string;
}

export class LinkEquipmentDto {
  @ApiProperty({ description: '设备ID列表' })
  @IsString({ each: true })
  equipmentIds: string[];

  @ApiPropertyOptional({ description: '安装位置' })
  @IsString()
  @IsOptional()
  installPosition?: string;

  @ApiPropertyOptional({ description: '单台设备用量' })
  @IsNumber()
  @IsOptional()
  usagePerEquipment?: number;
}
