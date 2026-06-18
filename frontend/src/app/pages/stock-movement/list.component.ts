import { Component, OnInit } from '@angular/core';
import { StockMovementService } from '../../core/services/stock-movement.service';

const MOVEMENT_TYPE_MAP: Record<string, { label: string; color: string }> = {
  inbound: { label: '采购入库', color: 'green' },
  outbound: { label: '维修出库', color: 'red' },
  adjustment_plus: { label: '盘盈调整', color: 'cyan' },
  adjustment_minus: { label: '盘亏调整', color: 'magenta' },
  stocktake: { label: '盘点', color: 'blue' },
  return: { label: '退库', color: 'purple' },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'default' },
};

@Component({
  selector: 'app-stock-movement-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>📋 出入库流水</h2>
        <div class="sub-title">每一笔出入库操作都有记录，支持按条件筛选和追溯</div>
      </div>

      <nz-row [nzGutter]="16" style="margin-bottom: 24px;">
        <nz-col [nzXs]="24" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzTitle]="'期间入库笔数'" [nzValue]="stats?.inbound?.count || 0" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic>
            <div style="margin-top: 8px; color: #8c8c8c; font-size: 12px;">
              数量：{{ stats?.inbound?.quantity || 0 }}件 &nbsp; 金额：¥{{ (stats?.inbound?.amount || 0) | number : '1.0-0' }}
            </div>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="24" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzTitle]="'期间出库笔数'" [nzValue]="stats?.outbound?.count || 0" [nzValueStyle]="{ color: '#f5222d' }"></nz-statistic>
            <div style="margin-top: 8px; color: #8c8c8c; font-size: 12px;">
              数量：{{ stats?.outbound?.quantity || 0 }}件 &nbsp; 金额：¥{{ (stats?.outbound?.amount || 0) | number : '1.0-0' }}
            </div>
          </nz-card>
        </nz-col>
      </nz-row>

      <div class="card-section">
        <div class="toolbar">
          <div class="toolbar-left">
            <nz-range-picker [(ngModel)]="dateRange" (ngModelChange)="onDateChange()"></nz-range-picker>
            <nz-select style="width: 160px;" [(ngModel)]="queryParams.movementType" nzPlaceHolder="出入库类型" nzAllowClear (ngModelChange)="loadData()">
              <nz-option *ngFor="let t of movementTypes" [nzValue]="t.value" [nzLabel]="t.label"></nz-option>
            </nz-select>
            <nz-input-group nzSearch [nzAddOnAfter]="searchIcon" style="width: 220px;">
              <input type="text" nz-input placeholder="搜索单号/备件" [(ngModel)]="queryParams.keyword" (keyup.enter)="loadData()" />
              <ng-template #searchIcon>
                <button nz-button nzType="primary" nzSearch (click)="loadData()"><i nz-icon nzType="search-outline"></i></button>
              </ng-template>
            </nz-input-group>
            <button nz-button (click)="resetQuery()"><i nz-icon nzType="reload-outline"></i> 重置</button>
          </div>
        </div>

        <nz-table #table [nzData]="list" [nzLoading]="loading" [nzTotal]="total" [(nzPageIndex)]="queryParams.page"
          [(nzPageSize)]="queryParams.pageSize" (nzPageIndexChange)="loadData()" (nzPageSizeChange)="loadData()"
          nzShowSizeChanger nzShowQuickJumper nzFrontPagination="false">
          <thead>
            <tr>
              <th>流水单号</th>
              <th style="width: 90px;">类型</th>
              <th>备件</th>
              <th>设备</th>
              <th style="width: 90px; text-align: right;">变动数量</th>
              <th style="width: 90px;">变动前</th>
              <th style="width: 90px;">变动后</th>
              <th style="width: 110px; text-align: right;">金额</th>
              <th>采购单/供应商</th>
              <th style="width: 90px;">经办人</th>
              <th style="width: 150px;">时间</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of list">
              <td><b style="color: #1890ff;">{{ item.orderNo }}</b></td>
              <td>
                <nz-tag [nzColor]="MOVEMENT_TYPE_MAP[item.movementType]?.color">
                  {{ MOVEMENT_TYPE_MAP[item.movementType]?.label || item.movementType }}
                </nz-tag>
              </td>
              <td>
                <div>{{ item.sparePart?.name }}</div>
                <div style="font-size: 12px; color: #8c8c8c;">{{ item.sparePart?.code }}</div>
              </td>
              <td>
                <div>{{ item.equipmentName || '-' }}</div>
                <div *ngIf="item.equipmentCode" style="font-size: 12px; color: #8c8c8c;">{{ item.equipmentCode }}</div>
              </td>
              <td style="text-align: right;">
                <span [style.color]="item.quantity > 0 ? '#52c41a' : '#f5222d'" style="font-weight: 600; font-size: 15px;">
                  {{ item.quantity > 0 ? '+' : '' }}{{ item.quantity }}
                </span>
              </td>
              <td style="text-align: center;">{{ item.stockBefore }}</td>
              <td style="text-align: center;"><b>{{ item.stockAfter }}</b></td>
              <td style="text-align: right;">¥{{ Math.abs(item.totalAmount || 0) | number : '1.2-2' }}</td>
              <td style="font-size: 12px;">
                <div *ngIf="item.relatedOrderNo">{{ item.relatedOrderNo }}</div>
                <div *ngIf="item.supplierName" style="color: #8c8c8c;">{{ item.supplierName }}</div>
              </td>
              <td>{{ item.operator || '-' }}</td>
              <td style="font-size: 12px; color: #8c8c8c;">{{ formatTime(item.createdAt) }}</td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
})
export class StockMovementListComponent implements OnInit {
  MOVEMENT_TYPE_MAP = MOVEMENT_TYPE_MAP;
  STATUS_MAP = STATUS_MAP;

  movementTypes = [
    { value: 'inbound', label: '采购入库' },
    { value: 'outbound', label: '维修出库' },
    { value: 'adjustment_plus', label: '盘盈调整' },
    { value: 'adjustment_minus', label: '盘亏调整' },
  ];

  loading = false;
  stats: any = {};
  list: any[] = [];
  total = 0;
  dateRange: Date[] = [];
  queryParams: any = { page: 1, pageSize: 20, keyword: '', movementType: '', sparePartId: '', equipmentId: '' };

  constructor(private stockMovementService: StockMovementService) {}

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.dateRange = [start, end];
    this.loadStats();
    this.loadData();
  }

  onDateChange(): void {
    if (this.dateRange && this.dateRange.length === 2) {
      this.queryParams.startDate = this.formatDate(this.dateRange[0]);
      this.queryParams.endDate = this.formatDate(this.dateRange[1]);
    } else {
      delete this.queryParams.startDate;
      delete this.queryParams.endDate;
    }
    this.loadStats();
    this.loadData();
  }

  loadStats(): void {
    this.stockMovementService.getStats(this.queryParams.startDate, this.queryParams.endDate).subscribe((res) => {
      this.stats = res;
    });
  }

  loadData(): void {
    this.loading = true;
    this.stockMovementService.list(this.queryParams).subscribe({
      next: (res) => {
        this.list = res.list;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  resetQuery(): void {
    this.queryParams = { page: 1, pageSize: 20, keyword: '', movementType: '', sparePartId: '', equipmentId: '' };
    this.dateRange = [];
    this.loadData();
  }

  formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatTime(d: any): string {
    if (!d) return '';
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}
