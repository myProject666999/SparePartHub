import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { StockMovement } from '../stock-movement/entities/stock-movement.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { SparePart } from '../spare-part/entities/spare-part.entity';
import { MaintenanceRecord } from '../maintenance/entities/maintenance-record.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Equipment, SparePart, MaintenanceRecord, Inventory])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
