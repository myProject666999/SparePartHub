import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { Equipment } from './entities/equipment.entity';
import { SparePartEquipment } from '../spare-part/entities/spare-part-equipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, SparePartEquipment])],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [TypeOrmModule, EquipmentService],
})
export class EquipmentModule {}
