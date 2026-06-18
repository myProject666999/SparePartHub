import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PurchaseSuggestionService } from './purchase-suggestion.service';
import {
  GeneratePurchaseSuggestionDto,
  ApprovePurchaseSuggestionDto,
  LinkPurchaseOrderDto,
  QueryPurchaseSuggestionDto,
} from './dto/purchase-suggestion.dto';

@ApiTags('请购建议管理')
@Controller('purchase-suggestions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PurchaseSuggestionController {
  constructor(private readonly purchaseSuggestionService: PurchaseSuggestionService) {}

  @Post('generate')
  @ApiOperation({ summary: '批量生成请购建议(根据安全库存)' })
  async generateSuggestions(@Body() dto: GeneratePurchaseSuggestionDto) {
    return this.purchaseSuggestionService.generateSuggestions(dto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询请购建议列表' })
  async findAll(@Query() dto: QueryPurchaseSuggestionDto) {
    return this.purchaseSuggestionService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取请购建议详情' })
  async findById(@Param('id') id: string) {
    return this.purchaseSuggestionService.findById(id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: '审批请购建议(通过/驳回)' })
  async approve(@Param('id') id: string, @Body() dto: ApprovePurchaseSuggestionDto) {
    return this.purchaseSuggestionService.approve(id, dto);
  }

  @Put(':id/link-purchase-order')
  @ApiOperation({ summary: '关联采购单号' })
  async linkPurchaseOrder(@Param('id') id: string, @Body() dto: LinkPurchaseOrderDto) {
    return this.purchaseSuggestionService.linkPurchaseOrder(id, dto);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: '标记请购单完成' })
  async markCompleted(@Param('id') id: string) {
    return this.purchaseSuggestionService.markCompleted(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除请购建议(仅待审批状态可删)' })
  async delete(@Param('id') id: string) {
    return this.purchaseSuggestionService.delete(id);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: '请购统计概览' })
  async getStats() {
    return this.purchaseSuggestionService.getStats();
  }
}
