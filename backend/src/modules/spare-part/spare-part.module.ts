import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SparePartController } from './spare-part.controller';
import { SparePartService } from './spare-part.service';
import { SparePart } from './entities/spare-part.entity';
import { SparePartEquipment } from './entities/spare-part-equipment.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SparePart, SparePartEquipment, Inventory])],
  controllers: [SparePartController],
  providers: [SparePartService],
  exports: [TypeOrmModule, SparePartService],
})
export class SparePartModule {}
