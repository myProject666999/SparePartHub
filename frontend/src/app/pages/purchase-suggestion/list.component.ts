import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PurchaseSuggestionService } from '../../core/services/purchase-suggestion.service';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待审批', color: 'orange' },
  approved: { label: '已批准', color: 'blue' },
  rejected: { label: '已驳回', color: 'default' },
  ordered: { label: '采购中', color: 'cyan' },
  completed: { label: '已完成', color: 'green' },
};

@Component({
  selector: 'app-purchase-suggestion-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>🛒 请购建议</h2>
        <div class="sub-title">库存低于安全下限自动生成请购建议，推送采购处理</div>
      </div>

      <nz-row [nzGutter]="16" style="margin-bottom: 24px;">
        <nz-col [nzXs]="8" [nzMd]="4">
          <nz-card style="background: #fff7e6;">
            <nz-statistic [nzTitle]="'待审批'" [nzValue]="stats?.pendingCount || 0" [nzValueStyle]="{ color: '#fa8c16' }"></nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="8" [nzMd]="4">
          <nz-card style="background: #e6f7ff;">
            <nz-statistic [nzTitle]="'已批准'" [nzValue]="stats?.approvedCount || 0" [nzValueStyle]="{ color: '#1890ff' }"></nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="8" [nzMd]="4">
          <nz-card style="background: #e6fffb;">
            <nz-statistic [nzTitle]="'采购中'" [nzValue]="stats?.orderedCount || 0" [nzValueStyle]="{ color: '#13c2c2' }"></nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzMd]="6">
          <nz-card style="background: #fff1f0;">
            <nz-statistic [nzTitle]="'🚨 紧急采购单'" [nzValue]="stats?.urgentCount || 0" [nzValueStyle]="{ color: '#f5222d' }"></nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzTitle]="'待采购总数量'" [nzValue]="stats?.totalSuggestedQuantity || 0" nzSuffix="件"></nz-statistic>
          </nz-card>
        </nz-col>
      </nz-row>

      <div class="card-section">
        <div class="toolbar">
          <div class="toolbar-left">
            <nz-select style="width: 140px;" [(ngModel)]="queryParams.status" nzPlaceHolder="状态筛选" nzAllowClear (ngModelChange)="loadData()">
              <nz-option *ngFor="let s of statusOptions" [nzValue]="s.value" [nzLabel]="s.label"></nz-option>
            </nz-select>
            <label nz-checkbox [(ngModel)]="queryParams.isUrgent" (ngModelChange)="loadData()">仅看紧急单</label>
            <nz-input-group nzSearch [nzAddOnAfter]="searchIcon" style="width: 220px;">
              <input type="text" nz-input placeholder="搜索单号/备件" [(ngModel)]="queryParams.keyword" (keyup.enter)="loadData()" />
              <ng-template #searchIcon>
                <button nz-button nzType="primary" nzSearch (click)="loadData()"><i nz-icon nzType="search" nzTheme="outline"></i></button>
              </ng-template>
            </nz-input-group>
          </div>
          <div class="toolbar-right">
            <button nz-button nzType="primary" (click)="generateSuggestions()" [nzLoading]="generating">
              <i nz-icon nzType="thunderbolt" nzTheme="outline"></i> 自动生成请购单
            </button>
          </div>
        </div>

        <nz-table #table [nzData]="list" [nzLoading]="loading" [nzTotal]="total" [(nzPageIndex)]="queryParams.page"
          [(nzPageSize)]="queryParams.pageSize" (nzPageIndexChange)="loadData()" (nzPageSizeChange)="loadData()"
          nzShowSizeChanger nzShowQuickJumper nzFrontPagination="false">
          <thead>
            <tr>
              <th style="width: 80px;">操作</th>
              <th>请购单号</th>
              <th>备件信息</th>
              <th style="width: 100px; text-align: right;">当前库存</th>
              <th style="width: 100px; text-align: right;">安全库存</th>
              <th style="width: 100px; text-align: right;">缺口</th>
              <th style="width: 110px; text-align: right;">建议采购</th>
              <th style="width: 100px;">预计可用天数</th>
              <th style="width: 90px;">状态</th>
              <th style="width: 130px;">采购单/到货</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of list" [ngClass]="{ 'urgent-row': item.isUrgent }">
              <td>
                <ng-container [ngSwitch]="item.status">
                  <ng-container *ngSwitchCase="'pending'">
                    <a (click)="approve(item)">审批</a>
                  </ng-container>
                  <ng-container *ngSwitchCase="'approved'">
                    <a (click)="linkOrder(item)">关联采购</a>
                  </ng-container>
                  <ng-container *ngSwitchCase="'ordered'">
                    <a (click)="markCompleted(item)">完成</a>
                  </ng-container>
                </ng-container>
              </td>
              <td>
                <b>{{ item.suggestionNo }}</b>
                <nz-tag *ngIf="item.isUrgent" nzColor="red" style="margin-left: 6px;">紧急</nz-tag>
              </td>
              <td>
                <div>{{ item.sparePart?.name }}</div>
                <div style="font-size: 12px; color: #8c8c8c;">{{ item.sparePart?.code }} | {{ item.sparePart?.specification }}</div>
              </td>
              <td style="text-align: right; color: #f5222d;"><b>{{ item.currentStock }}</b></td>
              <td style="text-align: right;">{{ item.safetyStock }}</td>
              <td style="text-align: right;"><b style="color: #fa541c;">{{ item.gapQuantity }}</b></td>
              <td style="text-align: right;">
                <span style="font-size: 16px; font-weight: 600; color: #1890ff;">{{ item.suggestedQuantity }}</span>
              </td>
              <td>
                <span *ngIf="item.estimatedDaysLeft !== null" [style.color]="item.estimatedDaysLeft <= 7 ? '#f5222d' : ''">
                  {{ item.estimatedDaysLeft }}天
                </span>
                <span *ngIf="item.estimatedDaysLeft === null" style="color: #bfbfbf;">-</span>
              </td>
              <td>
                <nz-tag [nzColor]="STATUS_MAP[item.status]?.color">
                  {{ STATUS_MAP[item.status]?.label }}
                </nz-tag>
              </td>
              <td style="font-size: 12px;">
                <div *ngIf="item.purchaseOrderNo">{{ item.purchaseOrderNo }}</div>
                <div *ngIf="item.expectedDeliveryDate" style="color: #8c8c8c;">
                  到货: {{ item.expectedDeliveryDate?.toString()?.slice(0, 10) }}
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
})
export class PurchaseSuggestionListComponent implements OnInit {
  STATUS_MAP = STATUS_MAP;

  statusOptions = [
    { value: 'pending', label: '待审批' },
    { value: 'approved', label: '已批准' },
    { value: 'rejected', label: '已驳回' },
    { value: 'ordered', label: '采购中' },
    { value: 'completed', label: '已完成' },
  ];

  loading = false;
  generating = false;
  stats: any = {};
  list: any[] = [];
  total = 0;
  queryParams: any = { page: 1, pageSize: 20, keyword: '', status: '', isUrgent: undefined };

  constructor(
    private service: PurchaseSuggestionService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadData();
  }

  loadStats(): void {
    this.service.getStats().subscribe((res) => (this.stats = res));
  }

  loadData(): void {
    this.loading = true;
    const params: any = { ...this.queryParams };
    if (params.isUrgent === false || params.isUrgent === undefined) delete params.isUrgent;
    this.service.list(params).subscribe({
      next: (res) => {
        this.list = res.list;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  generateSuggestions(): void {
    this.generating = true;
    this.service.generate().subscribe({
      next: (res: any[]) => {
        this.message.success(`成功生成 ${res.length} 条请购建议`);
        this.loadStats();
        this.loadData();
        this.generating = false;
      },
      error: () => (this.generating = false),
    });
  }

  approve(item: any): void {
    this.modal.confirm({
      nzTitle: `审批请购单 ${item.suggestionNo}`,
      nzContent: `备件：${item.sparePart?.name}，建议采购 ${item.suggestedQuantity} 件`,
      nzOkText: '批准',
      nzCancelText: '驳回',
      nzOnOk: () => {
        this.service.approve(item.id, 'approved').subscribe(() => {
          this.message.success('已批准');
          this.loadStats();
          this.loadData();
        });
      },
      nzOnCancel: () => {
        this.service.approve(item.id, 'rejected', '', '暂不需要采购').subscribe(() => {
          this.message.info('已驳回');
          this.loadData();
        });
      },
    });
  }

  linkOrder(item: any): void {
    this.modal.create({
      nzTitle: '关联采购单号',
      nzContent: `
        <div style="padding: 8px 0;">
          <nz-form-item>
            <nz-form-label>采购单号</nz-form-label>
            <nz-form-control>
              <input nz-input #poInput placeholder="请输入采购订单编号" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>采购数量</nz-form-label>
            <nz-form-control>
              <nz-input-number #qtyInput [nzMin]="1" [nzValue]="${item.suggestedQuantity}" style="width: 100%;"></nz-input-number>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>预计到货日期</nz-form-label>
            <nz-form-control>
              <nz-date-picker #dateInput style="width: 100%;"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>
        </div>
      `,
      nzFooter: [
        {
          label: '取消',
          onClick: () => this.modal.closeAll(),
        },
        {
          label: '确认关联',
          type: 'primary',
          onClick: (modal: any) => {
            const poNo = (document.querySelector('#' + modal.id + ' input[nz-input]') as HTMLInputElement)?.value;
            const qty = item.suggestedQuantity;
            if (!poNo) {
              this.message.error('请输入采购单号');
              return;
            }
            this.service.linkPurchaseOrder(item.id, poNo, qty).subscribe(() => {
              this.message.success('关联成功');
              this.modal.closeAll();
              this.loadStats();
              this.loadData();
            });
          },
        },
      ],
    });
  }

  markCompleted(item: any): void {
    this.modal.confirm({
      nzTitle: '确认完成',
      nzContent: `确认 ${item.suggestionNo} 采购已到货入库？`,
      nzOnOk: () => {
        this.service.markCompleted(item.id).subscribe(() => {
          this.message.success('已完成');
          this.loadStats();
          this.loadData();
        });
      },
    });
  }
}
