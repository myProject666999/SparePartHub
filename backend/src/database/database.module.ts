import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SparePart } from '../modules/spare-part/entities/spare-part.entity';
import { Equipment } from '../modules/equipment/entities/equipment.entity';
import { SparePartEquipment } from '../modules/spare-part/entities/spare-part-equipment.entity';
import { Inventory } from '../modules/inventory/entities/inventory.entity';
import { StockMovement } from '../modules/stock-movement/entities/stock-movement.entity';
import { MaintenanceRecord } from '../modules/maintenance/entities/maintenance-record.entity';
import { PurchaseSuggestion } from '../modules/purchase-suggestion/entities/purchase-suggestion.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', '123456'),
        database: configService.get('DB_DATABASE', 'spare_part_hub'),
        entities: [
          SparePart,
          Equipment,
          SparePartEquipment,
          Inventory,
          StockMovement,
          MaintenanceRecord,
          PurchaseSuggestion,
        ],
        synchronize: false,
        logging: false,
        charset: 'utf8mb4',
        timezone: '+08:00',
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
