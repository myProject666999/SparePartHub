import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceType, MaintenanceStatus } from '../entities/maintenance-record.entity';
import { PaginationQueryDto } from '../../../common/dto/response.dto';

export class CreateMaintenanceRecordDto {
  @ApiProperty({ description: '设备ID' })
  @IsString()
  @IsNotEmpty()
  equipmentId: string;

  @ApiPropertyOptional({ description: '维修类型', enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  @IsOptional()
  maintenanceType?: MaintenanceType;

  @ApiPropertyOptional({ description: '故障发生时间' })
  @IsString()
  @IsOptional()
  faultTime?: string;

  @ApiPropertyOptional({ description: '故障描述' })
  @IsString()
  @IsOptional()
  faultDescription?: string;

  @ApiPropertyOptional({ description: '报修人' })
  @IsString()
  @IsOptional()
  reporter?: string;

  @ApiPropertyOptional({ description: '维修负责人' })
  @IsString()
  @IsOptional()
  maintainer?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateMaintenanceRecordDto {
  @ApiPropertyOptional({ description: '维修状态', enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ description: '维修类型', enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  @IsOptional()
  maintenanceType?: MaintenanceType;

  @ApiPropertyOptional({ description: '维修开始时间' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '维修完成时间' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '停机时长(分钟)' })
  @IsNumber()
  @IsOptional()
  downtimeMinutes?: number;

  @ApiPropertyOptional({ description: '维修内容/过程' })
  @IsString()
  @IsOptional()
  maintenanceContent?: string;

  @ApiPropertyOptional({ description: '故障原因分析' })
  @IsString()
  @IsOptional()
  causeAnalysis?: string;

  @ApiPropertyOptional({ description: '预防措施' })
  @IsString()
  @IsOptional()
  preventiveMeasures?: string;

  @ApiPropertyOptional({ description: '人工费用' })
  @IsNumber()
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional({ description: '维修负责人' })
  @IsString()
  @IsOptional()
  maintainer?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryMaintenanceRecordDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '设备ID' })
  @IsString()
  @IsOptional()
  equipmentId?: string;

  @ApiPropertyOptional({ description: '维修类型', enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  @IsOptional()
  maintenanceType?: MaintenanceType;

  @ApiPropertyOptional({ description: '维修状态', enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ description: '开始日期 YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期 YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '维修负责人' })
  @IsString()
  @IsOptional()
  maintainer?: string;
}
