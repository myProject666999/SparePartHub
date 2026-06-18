import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Inventory } from './entities/inventory.entity';
import { SparePart } from '../spare-part/entities/spare-part.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { StockMovement } from '../stock-movement/entities/stock-movement.entity';
import { MaintenanceRecord } from '../maintenance/entities/maintenance-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, SparePart, Equipment, StockMovement, MaintenanceRecord]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [TypeOrmModule, InventoryService],
})
export class InventoryModule {}
