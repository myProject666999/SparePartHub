import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SparePartService, SparePart } from '../../core/services/spare-part.service';
import { EquipmentService } from '../../core/services/equipment.service';

const CATEGORY_MAP: Record<string, string> = {
  bearing: '轴承',
  belt: '皮带',
  motor: '电机',
  sensor: '传感器',
  seal: '密封件',
  gear: '齿轮',
  other: '其他',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '启用', color: 'green' },
  inactive: { label: '停用', color: 'default' },
  obsolete: { label: '淘汰', color: 'red' },
};

@Component({
  selector: 'app-spare-part-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>🏷️ 备件管理</h2>
        <div class="sub-title">建立备件档案，维护规格、货位、安全库存和适用设备等信息</div>
      </div>

      <div class="card-section">
        <div class="toolbar">
          <div class="toolbar-left">
            <nz-input-group nzSearch [nzAddOnAfter]="searchIcon" style="width: 280px;">
              <input type="text" nz-input placeholder="搜索编码/名称/规格" [(ngModel)]="queryParams.keyword" (keyup.enter)="loadData()" />
              <ng-template #searchIcon>
                <button nz-button nzType="primary" nzSearch (click)="loadData()"><i nz-icon nzType="search" nzTheme="outline"></i></button>
              </ng-template>
            </nz-input-group>
            <nz-select style="width: 140px;" [(ngModel)]="queryParams.category" nzPlaceHolder="选择分类" nzAllowClear (ngModelChange)="loadData()">
              <nz-option *ngFor="let c of categoryOptions" [nzValue]="c.value" [nzLabel]="c.label"></nz-option>
            </nz-select>
            <nz-select style="width: 140px;" [(ngModel)]="queryParams.status" nzPlaceHolder="选择状态" nzAllowClear (ngModelChange)="loadData()">
              <nz-option nzValue="active" nzLabel="启用"></nz-option>
              <nz-option nzValue="inactive" nzLabel="停用"></nz-option>
              <nz-option nzValue="obsolete" nzLabel="淘汰"></nz-option>
            </nz-select>
            <label nz-checkbox [(ngModel)]="queryParams.isHot" (ngModelChange)="loadData()">仅常用备件</label>
            <button nz-button (click)="resetQuery()"><i nz-icon nzType="reload" nzTheme="outline"></i> 重置</button>
          </div>
          <div class="toolbar-right">
            <button nz-button nzType="primary" (click)="router.navigate(['/spare-parts/new'])">
              <i nz-icon nzType="plus" nzTheme="outline"></i> 新建备件
            </button>
          </div>
        </div>

        <nz-table #table [nzData]="list" [nzLoading]="loading" [nzTotal]="total" [(nzPageIndex)]="queryParams.page"
          [(nzPageSize)]="queryParams.pageSize" (nzPageIndexChange)="loadData()" (nzPageSizeChange)="loadData()"
          nzShowSizeChanger nzShowQuickJumper nzFrontPagination="false">
          <thead>
            <tr>
              <th style="width: 100px;">操作</th>
              <th>备件编码</th>
              <th>备件名称</th>
              <th style="width: 90px;">分类</th>
              <th>规格型号</th>
              <th style="width: 100px;">货位</th>
              <th style="width: 90px;">单价</th>
              <th style="width: 100px;">当前库存</th>
              <th style="width: 90px;">安全库存</th>
              <th style="width: 80px;">状态</th>
              <th style="width: 70px;">常用</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of list">
              <td>
                <a (click)="viewDetail(item)">详情</a>
                <nz-divider nzType="vertical"></nz-divider>
                <a (click)="router.navigate(['/spare-parts/edit', item.id])">编辑</a>
              </td>
              <td><b>{{ item.code }}</b></td>
              <td>{{ item.name }}</td>
              <td><nz-tag>{{ CATEGORY_MAP[item.category] || item.category }}</nz-tag></td>
              <td style="color: #595959; font-size: 13px;">{{ item.specification }}</td>
              <td>{{ item.storageLocation }}</td>
              <td>¥{{ item.unitPrice | number : '1.2-2' }}</td>
              <td>
                <ng-container *ngIf="item.currentStock !== undefined">
                  <span *ngIf="item.currentStock <= (item.safetyStock || 0)" style="color: #f5222d; font-weight: bold;">
                    {{ item.currentStock }}
                    <i nz-icon nzType="warning" nzTheme="outline" style="color: #faad14;"></i>
                  </span>
                  <span *ngIf="item.currentStock > (item.safetyStock || 0)" style="color: #52c41a; font-weight: bold;">
                    {{ item.currentStock }}
                  </span>
                </ng-container>
                <span *ngIf="item.currentStock === undefined" style="color: #bfbfbf;">-</span>
              </td>
              <td>{{ item.safetyStock }}</td>
              <td>
                <nz-tag [nzColor]="STATUS_MAP[item.status]?.color">{{ STATUS_MAP[item.status]?.label }}</nz-tag>
              </td>
              <td>
                <nz-badge *ngIf="item.isHot" nzStatus="processing" nzText="常用"></nz-badge>
                <span *ngIf="!item.isHot" style="color: #bfbfbf;">-</span>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
})
export class SparePartListComponent implements OnInit {
  CATEGORY_MAP = CATEGORY_MAP;
  STATUS_MAP = STATUS_MAP;

  loading = false;
  list: any[] = [];
  total = 0;
  queryParams: any = { page: 1, pageSize: 20, keyword: '', category: '', status: '', isHot: undefined };
  categoryOptions = [
    { value: 'bearing', label: '轴承' },
    { value: 'belt', label: '皮带' },
    { value: 'motor', label: '电机' },
    { value: 'sensor', label: '传感器' },
    { value: 'seal', label: '密封件' },
    { value: 'gear', label: '齿轮' },
    { value: 'other', label: '其他' },
  ];

  constructor(
    public router: Router,
    private message: NzMessageService,
    private modal: NzModalService,
    private sparePartService: SparePartService,
    private equipmentService: EquipmentService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.sparePartService.list(this.queryParams).subscribe({
      next: (res: any) => {
        this.list = res.list;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  resetQuery(): void {
    this.queryParams = { page: 1, pageSize: 20, keyword: '', category: '', status: '', isHot: undefined };
    this.loadData();
  }

  viewDetail(item: any): void {
    this.sparePartService.getById(item.id).subscribe((detail) => {
      this.modal.info({
        nzTitle: `备件详情 - ${item.name}`,
        nzWidth: 720,
        nzContent: `
          <nz-descriptions [nzColumn]="2" nzBordered nzSize="small">
            <nz-descriptions-item nzTitle="备件编码">${detail.code || item.code}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="备件名称">${detail.name || item.name}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="分类">${CATEGORY_MAP[detail.category] || detail.category}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="状态">${STATUS_MAP[detail.status]?.label || '-'}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="规格型号">${detail.specification || '-'}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="品牌">${detail.brand || '-'}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="存放货位">${detail.storageLocation || '-'}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="计量单位">${detail.unit || '件'}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="单价">¥${Number(detail.unitPrice || 0).toFixed(2)}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="安全库存">${detail.safetyStock || 0}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="生产厂商">${detail.manufacturer || '-'}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="是否常用">${detail.isHot ? '是' : '否'}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="当前库存" [nzSpan]="2">
              <b style="color: #1890ff; font-size: 16px;">${detail.inventory?.currentStock || 0}</b>
              &nbsp;&nbsp;入库: ${detail.inventory?.totalInbound || 0}
              &nbsp;&nbsp;出库: ${detail.inventory?.totalOutbound || 0}
              &nbsp;&nbsp;金额: ¥${Number(detail.inventory?.inventoryValue || 0).toFixed(2)}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="备注" [nzSpan]="2">${detail.remark || '-'}</nz-descriptions-item>
          </nz-descriptions>
        `,
      });
    });
  }
}

@Component({
  selector: 'app-spare-part-form',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button nz-button (click)="router.navigate(['/spare-parts'])"><i nz-icon nzType="arrow-left" nzTheme="outline"></i> 返回</button>
        <span style="margin-left: 16px; font-size: 20px; font-weight: 600;">{{ isEdit ? '编辑备件' : '新建备件' }}</span>
      </div>

      <div class="card-section">
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="submit()">
          <nz-row [nzGutter]="24">
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>备件名称</nz-form-label>
                <nz-form-control nzErrorTip="请输入备件名称">
                  <input nz-input formControlName="name" placeholder="例如：深沟球轴承" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>备件分类</nz-form-label>
                <nz-form-control nzErrorTip="请选择分类">
                  <nz-select formControlName="category">
                    <nz-option *ngFor="let c of categoryOptions" [nzValue]="c.value" [nzLabel]="c.label"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>规格型号</nz-form-label>
                <nz-form-control nzErrorTip="请输入规格型号">
                  <input nz-input formControlName="specification" placeholder="例如：6205-2RS" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>品牌</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="brand" placeholder="例如：SKF/NSK/国产" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>单价(元)</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="unitPrice" [nzMin]="0" [nzStep]="0.01" style="width: 100%;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>存放货位</nz-form-label>
                <nz-form-control nzErrorTip="请输入存放货位">
                  <input nz-input formControlName="storageLocation" placeholder="例如：A区-3排-5列" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>安全库存下限</nz-form-label>
                <nz-form-control nzErrorTip="请输入安全库存">
                  <nz-input-number formControlName="safetyStock" [nzMin]="0" style="width: 100%;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>请购推荐数量</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="purchaseQuantity" [nzMin]="1" style="width: 100%;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>状态</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="status">
                    <nz-option nzValue="active" nzLabel="启用"></nz-option>
                    <nz-option nzValue="inactive" nzLabel="停用"></nz-option>
                    <nz-option nzValue="obsolete" nzLabel="淘汰"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>常用备件(Redis缓存)</nz-form-label>
                <nz-form-control>
                  <nz-switch formControlName="isHot" nzCheckedChildren="是" nzUnCheckedChildren="否"></nz-switch>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24">
              <nz-form-item>
                <nz-form-label>技术参数/备注</nz-form-label>
                <nz-form-control>
                  <textarea nz-input formControlName="remark" rows="3" placeholder="技术参数、材质说明、注意事项等"></textarea>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
          </nz-row>

          <div style="margin-top: 24px; text-align: center;">
            <button nz-button style="width: 120px;" (click)="router.navigate(['/spare-parts'])">取消</button>
            <button nz-button nzType="primary" style="width: 120px; margin-left: 16px;" [nzLoading]="submitting">
              <i nz-icon nzType="save" nzTheme="outline"></i> 保存
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SparePartFormComponent implements OnInit {
  categoryOptions = [
    { value: 'bearing', label: '轴承' },
    { value: 'belt', label: '皮带' },
    { value: 'motor', label: '电机' },
    { value: 'sensor', label: '传感器' },
    { value: 'seal', label: '密封件' },
    { value: 'gear', label: '齿轮' },
    { value: 'other', label: '其他' },
  ];

  isEdit = false;
  submitting = false;
  form: FormGroup;
  id = '';

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private message: NzMessageService,
    private sparePartService: SparePartService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      category: ['bearing', [Validators.required]],
      specification: ['', [Validators.required]],
      brand: [''],
      manufacturer: [''],
      unitPrice: [0],
      unit: ['件'],
      storageLocation: ['', [Validators.required]],
      safetyStock: [5, [Validators.required]],
      purchaseQuantity: [10],
      status: ['active'],
      isHot: [false],
      technicalParams: [''],
      remark: [''],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.isEdit = true;
      this.sparePartService.getById(this.id).subscribe((res) => {
        this.form.patchValue({
          name: res.name,
          category: res.category,
          specification: res.specification,
          brand: res.brand,
          manufacturer: res.manufacturer,
          unitPrice: res.unitPrice,
          unit: res.unit,
          storageLocation: res.storageLocation,
          safetyStock: res.safetyStock,
          purchaseQuantity: res.purchaseQuantity,
          status: res.status,
          isHot: res.isHot,
          technicalParams: res.technicalParams,
          remark: res.remark,
        });
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => c.markAsDirty());
      return;
    }
    this.submitting = true;
    const data = this.form.value;

    const request = this.isEdit
      ? this.sparePartService.update(this.id, data)
      : this.sparePartService.create(data);

    request.subscribe({
      next: () => {
        this.message.success(this.isEdit ? '更新成功' : '创建成功');
        this.router.navigate(['/spare-parts']);
        this.submitting = false;
      },
      error: () => (this.submitting = false),
    });
  }
}
