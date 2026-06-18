import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { StockMovement } from '../stock-movement/entities/stock-movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRecord, Equipment, StockMovement])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [TypeOrmModule, MaintenanceService],
})
export class MaintenanceModule {}
