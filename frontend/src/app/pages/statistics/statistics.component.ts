import { Component, OnInit } from '@angular/core';
import { StatisticsService } from '../../core/services/maintenance.service';
import dayjs from 'dayjs';

@Component({
  selector: 'app-statistics',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>📊 统计分析</h2>
        <div class="sub-title">按设备、按时间多维度分析备件消耗情况</div>
      </div>

      <div class="card-section">
        <div class="toolbar">
          <div class="toolbar-left">
            <nz-range-picker [(ngModel)]="dateRange" (ngModelChange)="onDateChange()"></nz-range-picker>
            <button nz-button (click)="setRange(7)">近7天</button>
            <button nz-button (click)="setRange(30)" nzType="primary">近30天</button>
            <button nz-button (click)="setRange(90)">近90天</button>
          </div>
        </div>
      </div>

      <nz-row [nzGutter]="16">
        <nz-col [nzXs]="24" [nzMd]="14">
          <div class="card-section">
            <div class="section-title">📈 出入库数量趋势</div>
            <div class="chart-container large" echarts [options]="trendOption"></div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzMd]="10">
          <div class="card-section">
            <div class="section-title">🧩 备件分类消耗占比</div>
            <div class="chart-container large" echarts [options]="categoryOption"></div>
          </div>
        </nz-col>
      </nz-row>

      <nz-row [nzGutter]="16" style="margin-top: 0;">
        <nz-col [nzXs]="24" [nzMd]="12">
          <div class="card-section">
            <div class="section-title">🏭 设备备件消耗金额 TOP 15</div>
            <div class="chart-container large" echarts [options]="equipmentRankOption"></div>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzMd]="12">
          <div class="card-section">
            <div class="section-title">🔩 备件消耗量 TOP 20</div>
            <div class="chart-container large" echarts [options]="sparePartRankOption"></div>
          </div>
        </nz-col>
      </nz-row>

      <div class="card-section">
        <div class="section-title">📋 消耗明细表</div>
        <nz-table #table [nzData]="equipmentList" [nzLoading]="equipmentLoading" [nzPageSize]="10">
          <thead>
            <tr>
              <th>设备编号</th>
              <th>设备名称</th>
              <th>车间</th>
              <th style="text-align: right;">消耗次数</th>
              <th style="text-align: right;">消耗数量</th>
              <th style="text-align: right;">消耗金额(元)</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of equipmentList">
              <td><b>{{ item.equipmentCode }}</b></td>
              <td>{{ item.equipmentName }}</td>
              <td>{{ item.workshop || '-' }}</td>
              <td style="text-align: right;">{{ item.consumptionCount }}</td>
              <td style="text-align: right;">{{ item.totalQuantity }}</td>
              <td style="text-align: right;">¥{{ item.totalAmount | number : '1.2-2' }}</td>
              <td>
                <nz-progress
                  [nzPercent]="totalAmount > 0 ? Math.round((item.totalAmount / totalAmount) * 100) : 0"
                  [nzShowInfo]="false"
                  [nzStrokeColor]="{ '0%': '#1890ff', '100%': '#722ed1' }"
                ></nz-progress>
                <span style="font-size: 12px; color: #8c8c8c;">
                  {{ totalAmount > 0 ? Math.round((item.totalAmount / totalAmount) * 100) : 0 }}%
                </span>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
})
export class StatisticsComponent implements OnInit {
  dateRange: Date[] = [];
  startDate = '';
  endDate = '';
  equipmentLoading = false;
  equipmentList: any[] = [];
  totalAmount = 0;

  trendOption: any = {};
  categoryOption: any = {};
  equipmentRankOption: any = {};
  sparePartRankOption: any = {};

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.setRange(30);
  }

  setRange(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    this.dateRange = [start, end];
    this.onDateChange();
  }

  onDateChange(): void {
    if (this.dateRange && this.dateRange.length === 2) {
      this.startDate = this.formatDate(this.dateRange[0]);
      this.endDate = this.formatDate(this.dateRange[1]);
    }
    this.loadAllData();
  }

  formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadAllData(): void {
    this.loadTrend();
    this.loadCategory();
    this.loadEquipmentRank();
    this.loadSparePartRank();
    this.loadEquipmentTable();
  }

  loadTrend(): void {
    const days = this.dateRange && this.dateRange.length === 2
      ? Math.ceil((this.dateRange[1].getTime() - this.dateRange[0].getTime()) / 86400000) + 1
      : 30;

    this.statisticsService.getConsumptionTrend(days).subscribe((res: any) => {
      const dates = res.list.map((i: any) => i.date.slice(5));
      this.trendOption = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['入库数量', '出库数量', '入库金额', '出库金额'], bottom: 0 },
        grid: { left: 50, right: 60, top: 20, bottom: 50 },
        xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10, rotate: 45 } },
        yAxis: [
          { type: 'value', name: '数量' },
          { type: 'value', name: '金额(¥)', axisLabel: { formatter: (v: number) => v / 1000 + 'k' } },
        ],
        series: [
          {
            name: '入库数量', type: 'bar', stack: 'in', data: res.list.map((i: any) => i.inboundQty),
            itemStyle: { color: '#95de64' }, barWidth: 12,
          },
          {
            name: '出库数量', type: 'bar', stack: 'out', data: res.list.map((i: any) => i.outboundQty),
            itemStyle: { color: '#69c0ff' }, barWidth: 12,
          },
          {
            name: '入库金额', type: 'line', smooth: true, yAxisIndex: 1,
            data: res.list.map((i: any) => i.inboundAmount),
            itemStyle: { color: '#52c41a' },
          },
          {
            name: '出库金额', type: 'line', smooth: true, yAxisIndex: 1,
            data: res.list.map((i: any) => i.outboundAmount),
            itemStyle: { color: '#1890ff' },
          },
        ],
      };
    });
  }

  loadCategory(): void {
    this.statisticsService.getConsumptionByCategory(this.startDate, this.endDate).subscribe((res: any) => {
      this.categoryOption = {
        tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
        legend: { type: 'scroll', bottom: 0 },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
            label: { formatter: '{b}\n{d}%' },
            data: res.list.map((i: any, idx: number) => ({
              name: i.categoryName || i.category,
              value: i.totalAmount,
              itemStyle: {
                color: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'][idx % 7],
              },
            })),
          },
        ],
      };
    });
  }

  loadEquipmentRank(): void {
    this.statisticsService.getConsumptionByEquipment(this.startDate, this.endDate, 15).subscribe((res: any) => {
      const names = res.list.map((i: any) => i.equipmentName);
      const amounts = res.list.map((i: any) => i.totalAmount);
      this.equipmentRankOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>¥{c}' },
        grid: { left: 110, right: 30, top: 10, bottom: 30 },
        xAxis: { type: 'value', axisLabel: { formatter: (v: number) => (v / 1000).toFixed(0) + 'k' } },
        yAxis: { type: 'category', data: names.reverse(), axisLabel: { fontSize: 11 } },
        series: [
          {
            type: 'bar',
            data: amounts.reverse(),
            barWidth: 14,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
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

  loadSparePartRank(): void {
    this.statisticsService.getConsumptionBySparePart(this.startDate, this.endDate, 20).subscribe((res: any) => {
      const names = res.list.map((i: any) => i.sparePartName + '(' + i.sparePartCode + ')');
      const qtys = res.list.map((i: any) => i.totalQuantity);
      this.sparePartRankOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>{c}件' },
        grid: { left: 160, right: 30, top: 10, bottom: 30 },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: names.reverse(), axisLabel: { fontSize: 10 } },
        series: [
          {
            type: 'bar',
            data: qtys.reverse(),
            barWidth: 12,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#fa709a' },
                  { offset: 1, color: '#fee140' },
                ],
              },
            },
          },
        ],
      };
    });
  }

  loadEquipmentTable(): void {
    this.equipmentLoading = true;
    this.statisticsService.getConsumptionByEquipment(this.startDate, this.endDate, 50).subscribe((res: any) => {
      this.equipmentList = res.list;
      this.totalAmount = res.list.reduce((sum: number, i: any) => sum + i.totalAmount, 0);
      this.equipmentLoading = false;
    });
  }
}
