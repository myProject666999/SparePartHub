import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { InventoryService } from '../../core/services/inventory.service';
import { SparePartService } from '../../core/services/spare-part.service';
import { EquipmentService } from '../../core/services/equipment.service';

const CATEGORY_MAP: Record<string, string> = {
  bearing: '轴承', belt: '皮带', motor: '电机', sensor: '传感器',
  seal: '密封件', gear: '齿轮', other: '其他',
};

const MOVEMENT_TYPE_MAP: Record<string, { label: string; color: string }> = {
  inbound: { label: '入库', color: 'green' },
  outbound: { label: '出库', color: 'red' },
  adjustment_plus: { label: '盘盈', color: 'cyan' },
  adjustment_minus: { label: '盘亏', color: 'magenta' },
  stocktake: { label: '盘点', color: 'blue' },
  return: { label: '退库', color: 'purple' },
};

@Component({
  selector: 'app-inventory-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>📦 库存查询</h2>
        <div class="sub-title">实时查看所有备件的库存状态、预警和金额</div>
      </div>

      <nz-row [nzGutter]="[16, 16]" style="margin-bottom: 24px;">
        <nz-col [nzXs]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzTitle]="'备件种类'" [nzValue]="stats?.totalSpareParts || 0"></nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzTitle]="'库存总价值'" [nzValue]="stats?.totalInventoryValue || 0" nzPrefix="¥" [nzPrecision]="2"></nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzTitle]="'低库存预警'" [nzValue]="stats?.lowStockCount || 0" [nzValueStyle]="{ color: '#f5222d' }"></nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzTitle]="'常用备件数'" [nzValue]="stats?.hotPartsCount || 0" [nzValueStyle]="{ color: '#1890ff' }"></nz-statistic>
          </nz-card>
        </nz-col>
      </nz-row>

      <div class="card-section">
        <div class="toolbar">
          <div class="toolbar-left">
            <nz-input-group nzSearch [nzAddOnAfter]="searchIcon" style="width: 260px;">
              <input type="text" nz-input placeholder="搜索编码/名称/规格" [(ngModel)]="queryParams.keyword" (keyup.enter)="loadData()" />
              <ng-template #searchIcon>
                <button nz-button nzType="primary" nzSearch (click)="loadData()"><i nz-icon nzType="search" nzTheme="outline"></i></button>
              </ng-template>
            </nz-input-group>
            <label nz-checkbox [(ngModel)]="queryParams.onlyLowStock" (ngModelChange)="loadData()">仅低于安全库存</label>
            <label nz-checkbox [(ngModel)]="queryParams.onlyHot" (ngModelChange)="loadData()">仅常用备件</label>
            <button nz-button (click)="resetQuery()"><i nz-icon nzType="reload" nzTheme="outline"></i> 重置</button>
          </div>
          <div class="toolbar-right">
            <button nz-button (click)="router.navigate(['/inventory/stock-in'])">
              <i nz-icon nzType="arrow-up" nzTheme="outline" style="color: #52c41a;"></i> 采购入库
            </button>
            <button nz-button nzType="primary" (click)="router.navigate(['/inventory/stock-out'])">
              <i nz-icon nzType="arrow-down" nzTheme="outline"></i> 维修领料
            </button>
            <button nz-button nzType="dashed" (click)="router.navigate(['/inventory/scan-out'])">
              <i nz-icon nzType="scan" nzTheme="outline"></i> 扫码出库
            </button>
          </div>
        </div>

        <nz-table #table [nzData]="list" [nzLoading]="loading" [nzTotal]="total" [(nzPageIndex)]="queryParams.page"
          [(nzPageSize)]="queryParams.pageSize" (nzPageIndexChange)="loadData()" (nzPageSizeChange)="loadData()"
          nzShowSizeChanger nzShowQuickJumper nzFrontPagination="false">
          <thead>
            <tr>
              <th>备件编码</th>
              <th>备件名称</th>
              <th>分类</th>
              <th>货位</th>
              <th style="width: 100px; text-align: right;">当前库存</th>
              <th style="width: 100px; text-align: right;">安全库存</th>
              <th style="width: 100px; text-align: right;">库存金额</th>
              <th style="width: 110px;">最近出入库</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of list" [ngClass]="{ 'urgent-row': item.currentStock <= (item.sparePart?.safetyStock || 0) }">
              <td><b>{{ item.sparePart?.code }}</b></td>
              <td>
                {{ item.sparePart?.name }}
                <span *ngIf="item.sparePart?.isHot" class="hot-badge" style="margin-left: 6px;">常用</span>
              </td>
              <td><nz-tag>{{ CATEGORY_MAP[item.sparePart?.category] || '-' }}</nz-tag></td>
              <td>{{ item.sparePart?.storageLocation }}</td>
              <td style="text-align: right;">
                <span style="font-size: 16px; font-weight: 600; color: {{ item.currentStock <= (item.sparePart?.safetyStock || 0) ? '#f5222d' : '#262626' }};">
                  {{ item.currentStock }}
                </span>
              </td>
              <td style="text-align: right;">{{ item.sparePart?.safetyStock || 0 }}</td>
              <td style="text-align: right;">¥{{ (item.inventoryValue || 0) | number : '1.2-2' }}</td>
              <td style="font-size: 12px; color: #8c8c8c;">
                <div *ngIf="item.lastInboundAt">入: {{ formatDate(item.lastInboundAt) }}</div>
                <div *ngIf="item.lastOutboundAt">出: {{ formatDate(item.lastOutboundAt) }}</div>
              </td>
              <td>
                <nz-tag *ngIf="item.currentStock <= 0" nzColor="red">缺货</nz-tag>
                <nz-tag *ngIf="item.currentStock > 0 && item.currentStock <= (item.sparePart?.safetyStock || 0)" nzColor="orange">低库存</nz-tag>
                <nz-tag *ngIf="item.currentStock > (item.sparePart?.safetyStock || 0)" nzColor="green">正常</nz-tag>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
})
export class InventoryListComponent implements OnInit {
  CATEGORY_MAP = CATEGORY_MAP;

  loading = false;
  stats: any = {};
  list: any[] = [];
  total = 0;
  queryParams: any = { page: 1, pageSize: 20, keyword: '', onlyLowStock: false, onlyHot: false, category: '' };

  constructor(
    public router: Router,
    private inventoryService: InventoryService,
    private sparePartService: SparePartService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadData();
  }

  loadStats(): void {
    this.inventoryService.getStats().subscribe((res) => (this.stats = res));
  }

  loadData(): void {
    this.loading = true;
    this.inventoryService.list(this.queryParams).subscribe({
      next: (res) => {
        this.list = res.list;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  resetQuery(): void {
    this.queryParams = { page: 1, pageSize: 20, keyword: '', onlyLowStock: false, onlyHot: false, category: '' };
    this.loadData();
  }

  formatDate(d: any): string {
    if (!d) return '-';
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}

@Component({
  selector: 'app-stock-in',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button nz-button (click)="router.navigate(['/inventory'])"><i nz-icon nzType="arrow-left" nzTheme="outline"></i> 返回</button>
        <span style="margin-left: 16px; font-size: 20px; font-weight: 600;">📥 采购入库</span>
      </div>

      <div class="card-section">
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="submit()">
          <nz-row [nzGutter]="24">
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>选择备件</nz-form-label>
                <nz-form-control nzErrorTip="请选择备件">
                  <nz-select
                    formControlName="sparePartId"
                    nzShowSearch
                    nzPlaceHolder="搜索并选择备件..."
                    nzServerSearch
                    (nzOnSearch)="searchSpareParts($event)"
                    (ngModelChange)="onSparePartChange()">
                    <nz-option *ngFor="let s of sparePartOptions" [nzValue]="s.id" [nzLabel]="s.code + ' - ' + s.name + ' (' + s.specification + ')'"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>入库数量</nz-form-label>
                <nz-form-control nzErrorTip="请输入入库数量">
                  <nz-input-number formControlName="quantity" [nzMin]="1" style="width: 100%;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>采购单号</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="relatedOrderNo" placeholder="关联的采购订单号" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>供应商</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="supplierName" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>入库单价(元)</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="unitPrice" [nzMin]="0" [nzStep]="0.01" style="width: 100%;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>入库经办人</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="operator" placeholder="请输入姓名" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24">
              <nz-form-item>
                <nz-form-label>备注</nz-form-label>
                <nz-form-control>
                  <textarea nz-input formControlName="remark" rows="2"></textarea>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
          </nz-row>

          <div *ngIf="selectedSparePart" nz-alert nzType="info" style="margin-bottom: 24px;">
            <ng-template #nzTemplate>
              备件信息：<b>{{ selectedSparePart.code }} - {{ selectedSparePart.name }}</b>（{{ selectedSparePart.specification }}）
              ，货位：{{ selectedSparePart.storageLocation }}，
              当前库存：<b style="color: #1890ff;">{{ currentStock }}</b>
            </ng-template>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <button nz-button style="width: 120px;" (click)="router.navigate(['/inventory'])">取消</button>
            <button nz-button nzType="primary" style="width: 120px; margin-left: 16px;" [nzLoading]="submitting">
              <i nz-icon nzType="check-circle" nzTheme="outline"></i> 确认入库
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class StockInComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  sparePartOptions: any[] = [];
  selectedSparePart: any = null;
  currentStock = 0;

  constructor(
    public router: Router,
    private fb: FormBuilder,
    private message: NzMessageService,
    private inventoryService: InventoryService,
    private sparePartService: SparePartService
  ) {
    this.form = this.fb.group({
      sparePartId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      relatedOrderNo: [''],
      supplierName: [''],
      unitPrice: [0],
      operator: [''],
      remark: [''],
    });
  }

  ngOnInit(): void {
    this.searchSpareParts('');
  }

  searchSpareParts(keyword: string): void {
    this.sparePartService.list({ page: 1, pageSize: 50, keyword }).subscribe((res: any) => {
      this.sparePartOptions = res.list;
    });
  }

  onSparePartChange(): void {
    const id = this.form.value.sparePartId;
    if (!id) {
      this.selectedSparePart = null;
      return;
    }
    this.sparePartService.getById(id).subscribe((res) => {
      this.selectedSparePart = res;
      this.currentStock = res.inventory?.currentStock || 0;
      if (res.unitPrice && !this.form.value.unitPrice) {
        this.form.patchValue({ unitPrice: res.unitPrice });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => c.markAsDirty());
      return;
    }
    this.submitting = true;
    this.inventoryService.stockIn(this.form.value).subscribe({
      next: () => {
        this.message.success('入库成功');
        this.router.navigate(['/stock-movements']);
        this.submitting = false;
      },
      error: () => (this.submitting = false),
    });
  }
}

@Component({
  selector: 'app-stock-out',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button nz-button (click)="router.navigate(['/inventory'])"><i nz-icon nzType="arrow-left" nzTheme="outline"></i> 返回</button>
        <span style="margin-left: 16px; font-size: 20px; font-weight: 600;">📤 维修领料出库</span>
      </div>

      <div class="card-section">
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="submit()">
          <nz-row [nzGutter]="24">
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>选择备件</nz-form-label>
                <nz-form-control nzErrorTip="请选择备件">
                  <nz-select
                    formControlName="sparePartId"
                    nzShowSearch
                    nzPlaceHolder="搜索并选择备件..."
                    (nzOnSearch)="searchSpareParts($event)"
                    (ngModelChange)="onSparePartChange()">
                    <nz-option *ngFor="let s of sparePartOptions" [nzValue]="s.id"
                      [nzLabel]="s.code + ' - ' + s.name + ' [库存:' + (s.currentStock || 0) + ']'">
                    </nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>领用数量</nz-form-label>
                <nz-form-control nzErrorTip="请输入领用数量">
                  <nz-input-number formControlName="quantity" [nzMin]="1"
                    [nzMax]="currentStock" style="width: 100%;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>使用设备</nz-form-label>
                <nz-form-control nzErrorTip="请选择设备">
                  <nz-select formControlName="equipmentId" nzShowSearch nzPlaceHolder="选择维修的设备">
                    <nz-option *ngFor="let e of equipmentOptions" [nzValue]="e.id" [nzLabel]="e.code + ' - ' + e.name + ' (' + (e.workshop || '') + ')'"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>关联维修单号</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="maintenanceRecordId" placeholder="可选，关联维修工单" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>领料人</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="operator" placeholder="维修人员姓名" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>领用部门</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="department" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24">
              <nz-form-item>
                <nz-form-label>备注</nz-form-label>
                <nz-form-control>
                  <textarea nz-input formControlName="remark" rows="2" placeholder="领用说明、更换位置等"></textarea>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
          </nz-row>

          <div *ngIf="selectedSparePart" nz-alert [nzType]="stockWarningType" style="margin-bottom: 24px;">
            <ng-template #nzTemplate>
              <b>库存检查：</b>
              {{ selectedSparePart.code }} - {{ selectedSparePart.name }}
              当前库存：<b>{{ currentStock }}</b>
              <span *ngIf="willStockLow" style="color: #f5222d; margin-left: 12px;">
                ⚠️ 出库后将低于安全库存（{{ selectedSparePart.safetyStock }}）
              </span>
            </ng-template>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <button nz-button style="width: 120px;" (click)="router.navigate(['/inventory'])">取消</button>
            <button nz-button nzType="primary" style="width: 120px; margin-left: 16px;" [nzLoading]="submitting">
              <i nz-icon nzType="check-circle" nzTheme="outline"></i> 确认出库
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class StockOutComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  sparePartOptions: any[] = [];
  equipmentOptions: any[] = [];
  selectedSparePart: any = null;
  currentStock = 0;

  constructor(
    public router: Router,
    private fb: FormBuilder,
    private message: NzMessageService,
    private inventoryService: InventoryService,
    private sparePartService: SparePartService,
    private equipmentService: EquipmentService
  ) {
    this.form = this.fb.group({
      sparePartId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      equipmentId: ['', [Validators.required]],
      maintenanceRecordId: [''],
      operator: [''],
      department: [''],
      remark: [''],
    });
  }

  ngOnInit(): void {
    this.searchSpareParts('');
    this.equipmentService.listSimple().subscribe((res) => (this.equipmentOptions = res));
  }

  get stockWarningType(): string {
    return this.willStockLow ? 'warning' : 'info';
  }

  get willStockLow(): boolean {
    if (!this.selectedSparePart || !this.form.value.quantity) return false;
    return this.currentStock - this.form.value.quantity <= this.selectedSparePart.safetyStock;
  }

  searchSpareParts(keyword: string): void {
    this.inventoryService.list({ page: 1, pageSize: 100, keyword }).subscribe((res: any) => {
      this.sparePartOptions = res.list
        .filter((i: any) => i.currentStock > 0)
        .map((i: any) => ({
          ...i.sparePart,
          currentStock: i.currentStock,
        }));
    });
  }

  onSparePartChange(): void {
    const id = this.form.value.sparePartId;
    if (!id) {
      this.selectedSparePart = null;
      return;
    }
    this.sparePartService.getById(id).subscribe((res) => {
      this.selectedSparePart = res;
      this.currentStock = res.inventory?.currentStock || 0;
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => c.markAsDirty());
      return;
    }
    this.submitting = true;
    this.inventoryService.stockOut(this.form.value).subscribe({
      next: () => {
        this.message.success('出库成功');
        this.router.navigate(['/stock-movements']);
        this.submitting = false;
      },
      error: () => (this.submitting = false),
    });
  }
}

@Component({
  selector: 'app-scan-out',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button nz-button (click)="router.navigate(['/inventory'])"><i nz-icon nzType="arrow-left" nzTheme="outline"></i> 返回</button>
        <span style="margin-left: 16px; font-size: 20px; font-weight: 600;">📱 扫码快速出库</span>
        <span style="margin-left: 12px; color: #8c8c8c; font-size: 13px;">适合维修工手持设备扫码快速领件</span>
      </div>

      <div class="card-section">
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="submit()">
          <nz-row [nzGutter]="24">
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>备件条码</nz-form-label>
                <nz-form-control nzErrorTip="扫描或输入备件条码">
                  <input nz-input formControlName="barcode" placeholder="扫码枪扫描或手动输入条码/编码"
                    style="height: 48px; font-size: 16px;" autocomplete="off" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>设备编码</nz-form-label>
                <nz-form-control nzErrorTip="扫描或输入设备编码">
                  <input nz-input formControlName="equipmentCode" placeholder="扫描设备条码或输入设备编号"
                    style="height: 48px; font-size: 16px;" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>出库数量</nz-form-label>
                <nz-form-control nzErrorTip="请输入数量">
                  <nz-input-number formControlName="quantity" [nzMin]="1" style="width: 100%; height: 48px;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>维修单号(可选)</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="maintenanceOrderNo" style="height: 48px;" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>领料人</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="operator" style="height: 48px;" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24">
              <nz-form-item>
                <nz-form-label>备注</nz-form-label>
                <nz-form-control>
                  <textarea nz-input formControlName="remark" rows="2"></textarea>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
          </nz-row>

          <div style="margin-top: 32px; text-align: center;">
            <button nz-button style="width: 160px; height: 48px;" type="button" (click)="form.reset()">
              <i nz-icon nzType="redo" nzTheme="outline"></i> 清空重扫
            </button>
            <button nz-button nzType="primary" style="width: 200px; height: 48px; margin-left: 16px; font-size: 16px;"
              type="submit" [nzLoading]="submitting">
              <i nz-icon nzType="scan" nzTheme="outline"></i> 扫码确认出库
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ScanOutComponent {
  form: FormGroup;
  submitting = false;

  constructor(
    public router: Router,
    private fb: FormBuilder,
    private message: NzMessageService,
    private inventoryService: InventoryService
  ) {
    this.form = this.fb.group({
      barcode: ['', [Validators.required]],
      equipmentCode: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      maintenanceOrderNo: [''],
      operator: [''],
      remark: [''],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => c.markAsDirty());
      return;
    }
    this.submitting = true;
    this.inventoryService.scanStockOut(this.form.value).subscribe({
      next: (res) => {
        this.message.success(`出库成功！单号: ${res?.orderNo || ''}`);
        this.form.reset({ quantity: 1 });
        this.submitting = false;
      },
      error: () => (this.submitting = false),
    });
  }
}
