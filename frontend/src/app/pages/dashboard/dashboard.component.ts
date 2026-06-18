import { Component, OnInit } from '@angular/core';
import { StatisticsService } from '../../core/services/maintenance.service';
import { InventoryService } from '../../core/services/inventory.service';
import { PurchaseSuggestionService } from '../../core/services/purchase-suggestion.service';
import { MaintenanceService } from '../../core/services/maintenance.service';
import dayjs from 'dayjs';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>📊 数据看板</h2>
        <div class="sub-title">实时掌握库存动态、消耗趋势与异常预警</div>
      </div>

      <nz-row [nzGutter]="[16, 16]">
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <div class="stat-card info">
            <div class="stat-label">备件品种数</div>
            <div class="stat-value">{{ dashboard?.overview?.totalSpareParts || 0 }}</div>
            <div class="stat-desc">在库所有备件规格总数</div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <div class="stat-card">
            <div class="stat-label">设备台数</div>
            <div class="stat-value">{{ dashboard?.overview?.totalEquipments || 0 }}</div>
            <div class="stat-desc">纳入管理的设备总数</div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <div class="stat-card warning">
            <div class="stat-label">⚠️ 低库存预警</div>
            <div class="stat-value">{{ dashboard?.overview?.lowStockCount || 0 }}</div>
            <div class="stat-desc">库存低于安全下限的备件</div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <div class="stat-card success">
            <div class="stat-label">库存总价值(元)</div>
            <div class="stat-value">{{ (dashboard?.overview?.inventoryValue || 0) | number : '1.0-0' }}</div>
            <div class="stat-desc">当前库存金额总计</div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <div class="stat-card orange">
            <div class="stat-label">本月维修次数</div>
            <div class="stat-value">{{ dashboard?.overview?.maintenanceThisMonth || 0 }}</div>
            <div class="stat-desc">当月产生的维修工单</div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="stat-label">本月入库数量</div>
            <div class="stat-value">{{ dashboard?.currentMonth?.inboundQty || 0 }}</div>
            <div class="stat-desc">采购入库总件数</div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <div class="stat-card info">
            <div class="stat-label">本月出库数量</div>
            <div class="stat-value">{{ dashboard?.currentMonth?.outboundQty || 0 }}</div>
            <div class="stat-desc">维修领料总件数</div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <div class="stat-card success">
            <div class="stat-label">
              本月备件消耗(元)
              <span *ngIf="dashboard?.comparison" style="margin-left: 8px; font-size: 12px;">
                <span *ngIf="dashboard.comparison.monthGrowthRate > 0" style="color: #ff7875;">↑ {{ dashboard.comparison.monthGrowthRate }}%</span>
                <span *ngIf="dashboard.comparison.monthGrowthRate <= 0" style="color: #b7eb8f;">↓ {{ Math.abs(dashboard.comparison.monthGrowthRate) }}%</span>
              </span>
            </div>
            <div class="stat-value">{{ (dashboard?.currentMonth?.outboundAmount || 0) | number : '1.0-0' }}</div>
            <div class="stat-desc">上月消耗: {{ (dashboard?.comparison?.lastMonthOutboundAmount || 0) | number : '1.0-0' }}元</div>
          </div>
        </nz-col>
      </nz-row>

      <nz-row [nzGutter]="16" style="margin-top: 24px;">
        <nz-col [nzXs]="24" [nzMd]="16">
          <div class="card-section">
            <div class="section-title">📈 出入库消耗趋势(近30天)</div>
            <div class="chart-container" echarts [options]="trendOption" (chartInit)="onTrendInit($event)"></div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzMd]="8">
          <div class="card-section">
            <div class="section-title">🧾 请购单状态</div>
            <div class="chart-container" echarts [options]="purchaseOption"></div>
          </div>
        </nz-col>
      </nz-row>

      <nz-row [nzGutter]="16" style="margin-top: 16px;">
        <nz-col [nzXs]="24" [nzMd]="12">
          <div class="card-section">
            <div class="section-title">🚨 低库存清单(需紧急采购)</div>
            <nz-table #lowStockTable [nzData]="lowStockList" [nzPageSize]="5" [nzShowPagination]="false" nzSize="small">
              <thead>
                <tr>
                  <th>备件编码</th>
                  <th>备件名称</th>
                  <th>当前库存</th>
                  <th>安全库存</th>
                  <th>缺口</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of lowStockList" class="urgent-row">
                  <td><b>{{ item.sparePart?.code }}</b></td>
                  <td>{{ item.sparePart?.name }}</td>
                  <td><nz-tag nzColor="red">{{ item.currentStock }}</nz-tag></td>
                  <td>{{ item.safetyStock }}</td>
                  <td><b style="color: #f5222d;">{{ item.gap }}</b></td>
                </tr>
                <tr *ngIf="lowStockList.length === 0">
                  <td colspan="5" class="empty-state">✅ 当前无低库存备件，库存充足</td>
                </tr>
              </tbody>
            </nz-table>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzMd]="12">
          <div class="card-section">
            <div class="section-title">🏭 设备备件消耗TOP10(本月)</div>
            <div class="chart-container large" echarts [options]="equipmentRankOption"></div>
          </div>
        </nz-col>
      </nz-row>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  dashboard: any = {};
  lowStockList: any[] = [];
  purchaseStats: any = {};
  trendData: any = { list: [] };
  equipmentRankData: any = { list: [] };

  trendOption: any = {};
  purchaseOption: any = {};
  equipmentRankOption: any = {};

  constructor(
    private statisticsService: StatisticsService,
    private inventoryService: InventoryService,
    private purchaseService: PurchaseSuggestionService,
    private maintenanceService: MaintenanceService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadLowStock();
    this.loadPurchaseStats();
    this.loadTrend();
    this.loadEquipmentRank();
  }

  loadDashboard(): void {
    this.statisticsService.getDashboard().subscribe((res) => {
      this.dashboard = res;
    });
  }

  loadLowStock(): void {
    this.inventoryService.getLowStock().subscribe((res) => {
      this.lowStockList = res.slice(0, 5);
    });
  }

  loadPurchaseStats(): void {
    this.purchaseService.getStats().subscribe((res) => {
      this.purchaseStats = res;
      this.purchaseOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center' },
        series: [
          {
            name: '请购状态',
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: [
              { value: res.pendingCount || 0, name: '待审批', itemStyle: { color: '#faad14' } },
              { value: res.approvedCount || 0, name: '已审批', itemStyle: { color: '#1890ff' } },
              { value: res.orderedCount || 0, name: '采购中', itemStyle: { color: '#52c41a' } },
              { value: res.urgentCount || 0, name: '紧急单', itemStyle: { color: '#f5222d' } },
            ],
          },
        ],
      };
    });
  }

  loadTrend(): void {
    this.statisticsService.getConsumptionTrend(30).subscribe((res) => {
      this.trendData = res;
      const dates = res.list.map((i: any) => i.date.slice(5));
      this.trendOption = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['入库数量', '出库数量'], bottom: 0 },
        grid: { left: 40, right: 20, top: 20, bottom: 40 },
        xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value' },
        series: [
          {
            name: '入库数量',
            type: 'line',
            smooth: true,
            data: res.list.map((i: any) => i.inboundQty),
            itemStyle: { color: '#52c41a' },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(82,196,26,0.3)' }, { offset: 1, color: 'rgba(82,196,26,0.05)' }] } },
          },
          {
            name: '出库数量',
            type: 'line',
            smooth: true,
            data: res.list.map((i: any) => i.outboundQty),
            itemStyle: { color: '#1890ff' },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24,144,255,0.3)' }, { offset: 1, color: 'rgba(24,144,255,0.05)' }] } },
          },
        ],
      };
    });
  }

  loadEquipmentRank(): void {
    const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().format('YYYY-MM-DD');
    this.statisticsService.getConsumptionByEquipment(startDate, endDate, 10).subscribe((res) => {
      this.equipmentRankData = res;
      const names = res.list.map((i: any) => i.equipmentName);
      const amounts = res.list.map((i: any) => i.totalAmount);
      this.equipmentRankOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>消耗金额: ¥{c}' },
        grid: { left: 120, right: 40, top: 10, bottom: 30 },
        xAxis: { type: 'value', axisLabel: { formatter: (v: number) => v / 1000 + 'k' } },
        yAxis: { type: 'category', data: names.reverse(), axisLabel: { fontSize: 11 } },
        series: [
          {
            type: 'bar',
            data: amounts.reverse(),
            barWidth: 16,
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#667eea' },
                  { offset: 1, color: '#764ba2' },
                ],
              },
            },
          },
        ],
      };
    });
  }

  onTrendInit(chart: any): void {
    setTimeout(() => chart.resize(), 100);
  }
}
