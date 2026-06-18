import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStatus } from '../entities/equipment.entity';
import { PaginationQueryDto } from '../../../common/dto/response.dto';

export class CreateEquipmentDto {
  @ApiProperty({ description: '设备名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '设备型号' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: '设备类别' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '所属车间/产线' })
  @IsString()
  @IsOptional()
  workshop?: string;

  @ApiPropertyOptional({ description: '安装位置' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: '投产日期' })
  @IsDateString()
  @IsOptional()
  commissionDate?: string;

  @ApiPropertyOptional({ description: '设备状态', enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  @IsOptional()
  status?: EquipmentStatus;

  @ApiPropertyOptional({ description: '负责人' })
  @IsString()
  @IsOptional()
  responsiblePerson?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateEquipmentDto {
  @ApiPropertyOptional({ description: '设备名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '设备型号' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: '设备类别' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '所属车间/产线' })
  @IsString()
  @IsOptional()
  workshop?: string;

  @ApiPropertyOptional({ description: '安装位置' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: '投产日期' })
  @IsDateString()
  @IsOptional()
  commissionDate?: string;

  @ApiPropertyOptional({ description: '设备状态', enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  @IsOptional()
  status?: EquipmentStatus;

  @ApiPropertyOptional({ description: '负责人' })
  @IsString()
  @IsOptional()
  responsiblePerson?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryEquipmentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '设备类别' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '所属车间' })
  @IsString()
  @IsOptional()
  workshop?: string;

  @ApiPropertyOptional({ description: '设备状态', enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  @IsOptional()
  status?: EquipmentStatus;

  @ApiPropertyOptional({ description: '备件ID(查询可用该备件的设备)' })
  @IsString()
  @IsOptional()
  sparePartId?: string;
}
