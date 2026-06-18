import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { SparePartModule } from './modules/spare-part/spare-part.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StockMovementModule } from './modules/stock-movement/stock-movement.module';
import { PurchaseSuggestionModule } from './modules/purchase-suggestion/purchase-suggestion.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    RedisModule,
    SparePartModule,
    EquipmentModule,
    InventoryModule,
    StockMovementModule,
    PurchaseSuggestionModule,
    StatisticsModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
