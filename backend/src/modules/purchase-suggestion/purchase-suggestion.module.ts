import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseSuggestionController } from './purchase-suggestion.controller';
import { PurchaseSuggestionService } from './purchase-suggestion.service';
import { PurchaseSuggestion } from './entities/purchase-suggestion.entity';
import { SparePart } from '../spare-part/entities/spare-part.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseSuggestion, SparePart, Inventory])],
  controllers: [PurchaseSuggestionController],
  providers: [PurchaseSuggestionService],
  exports: [TypeOrmModule, PurchaseSuggestionService],
})
export class PurchaseSuggestionModule {}
