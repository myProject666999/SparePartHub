import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovementController } from './stock-movement.controller';
import { StockMovementService } from './stock-movement.service';
import { StockMovement } from './entities/stock-movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement])],
  controllers: [StockMovementController],
  providers: [StockMovementService],
  exports: [TypeOrmModule, StockMovementService],
})
export class StockMovementModule {}
