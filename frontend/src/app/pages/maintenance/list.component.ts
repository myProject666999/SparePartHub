import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { EquipmentService } from '../../core/services/equipment.service';

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  preventive: { label: '预防性维护', color: 'blue' },
  corrective: { label: '故障维修', color: 'orange' },
  breakdown: { label: '突发抢修', color: 'red' },
  overhaul: { label: '大修', color: 'purple' },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  in_progress: { label: '维修中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'default' },
};

@Component({
  selector: 'app-maintenance-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>🔨 维修记录</h2>
        <div class="sub-title">设备维修工单管理，关联备件消耗和维修详情</div>
      </div>

      <div class="card-section">
        <div class="toolbar">
          <div class="toolbar-left">
            <nz-select style="width: 140px;" [(ngModel)]="queryParams.status" nzPlaceHolder="状态筛选" nzAllowClear (ngModelChange)="loadData()">
              <nz-option *ngFor="let s of statusOptions" [nzValue]="s.value" [nzLabel]="s.label"></nz-option>
            </nz-select>
            <nz-range-picker [(ngModel)]="dateRange" (ngModelChange)="onDateChange()"></nz-range-picker>
            <nz-input-group nzSearch [nzAddOnAfter]="searchIcon" style="width: 220px;">
              <input type="text" nz-input placeholder="搜索单号/设备" [(ngModel)]="queryParams.keyword" (keyup.enter)="loadData()" />
              <ng-template #searchIcon>
                <button nz-button nzType="primary" nzSearch (click)="loadData()"><i nz-icon nzType="search-outline"></i></button>
              </ng-template>
            </nz-input-group>
            <button nz-button (click)="resetQuery()"><i nz-icon nzType="reload-outline"></i> 重置</button>
          </div>
          <div class="toolbar-right">
            <button nz-button nzType="primary" (click)="router.navigate(['/maintenance/new'])">
              <i nz-icon nzType="plus-outline"></i> 新建维修记录
            </button>
          </div>
        </div>

        <nz-table #table [nzData]="list" [nzLoading]="loading" [nzTotal]="total" [(nzPageIndex)]="queryParams.page"
          [(nzPageSize)]="queryParams.pageSize" (nzPageIndexChange)="loadData()" (nzPageSizeChange)="loadData()"
          nzShowSizeChanger nzShowQuickJumper nzFrontPagination="false">
          <thead>
            <tr>
              <th style="width: 70px;">操作</th>
              <th>维修单号</th>
              <th>设备</th>
              <th style="width: 100px;">类型</th>
              <th style="width: 90px;">状态</th>
              <th>故障描述</th>
              <th style="width: 100px;">停机时长</th>
              <th style="width: 110px;">备件费用</th>
              <th style="width: 90px;">维修人</th>
              <th style="width: 140px;">时间</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of list">
              <td>
                <a (click)="router.navigate(['/maintenance/edit', item.id])">编辑</a>
              </td>
              <td><b style="color: #1890ff;">{{ item.orderNo }}</b></td>
              <td>
                <div>{{ item.equipment?.name }}</div>
                <div style="font-size: 12px; color: #8c8c8c;">{{ item.equipment?.code }}</div>
              </td>
              <td><nz-tag [nzColor]="TYPE_MAP[item.maintenanceType]?.color">{{ TYPE_MAP[item.maintenanceType]?.label }}</nz-tag></td>
              <td><nz-tag [nzColor]="STATUS_MAP[item.status]?.color">{{ STATUS_MAP[item.status]?.label }}</nz-tag></td>
              <td style="max-width: 240px;" [nzTitle]="item.faultDescription">{{ (item.faultDescription || '-').slice(0, 50) }}{{ item.faultDescription?.length > 50 ? '...' : '' }}</td>
              <td>{{ item.downtimeMinutes ? item.downtimeMinutes + '分钟' : '-' }}</td>
              <td>
                <div>备件: ¥{{ (item.sparePartCost || 0) | number : '1.2-2' }}</div>
                <div style="font-size: 12px; color: #8c8c8c;">合计: ¥{{ (item.totalCost || 0) | number : '1.2-2' }}</div>
              </td>
              <td>{{ item.maintainer || '-' }}</td>
              <td style="font-size: 12px; color: #8c8c8c;">{{ formatTime(item.createdAt) }}</td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
})
export class MaintenanceListComponent implements OnInit {
  TYPE_MAP = TYPE_MAP;
  STATUS_MAP = STATUS_MAP;

  statusOptions = [
    { value: 'pending', label: '待处理' },
    { value: 'in_progress', label: '维修中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];

  loading = false;
  list: any[] = [];
  total = 0;
  dateRange: Date[] = [];
  queryParams: any = { page: 1, pageSize: 20, keyword: '', status: '', equipmentId: '' };

  constructor(public router: Router, private service: MaintenanceService) {}

  ngOnInit(): void {
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
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.service.list(this.queryParams).subscribe({
      next: (res) => {
        this.list = res.list;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  resetQuery(): void {
    this.queryParams = { page: 1, pageSize: 20, keyword: '', status: '', equipmentId: '' };
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

@Component({
  selector: 'app-maintenance-form',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button nz-button (click)="router.navigate(['/maintenance'])"><i nz-icon nzType="arrow-left-outline"></i> 返回</button>
        <span style="margin-left: 16px; font-size: 20px; font-weight: 600;">{{ isEdit ? '编辑维修记录' : '新建维修记录' }}</span>
      </div>

      <div class="card-section">
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="submit()">
          <nz-row [nzGutter]="24">
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>选择设备</nz-form-label>
                <nz-form-control nzErrorTip="请选择设备">
                  <nz-select formControlName="equipmentId" nzShowSearch>
                    <nz-option *ngFor="let e of equipmentList" [nzValue]="e.id"
                      [nzLabel]="e.code + ' - ' + e.name + ' (' + (e.workshop || '') + ')'"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>维修类型</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="maintenanceType">
                    <nz-option nzValue="preventive" nzLabel="预防性维护"></nz-option>
                    <nz-option nzValue="corrective" nzLabel="故障维修"></nz-option>
                    <nz-option nzValue="breakdown" nzLabel="突发抢修"></nz-option>
                    <nz-option nzValue="overhaul" nzLabel="大修"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>状态</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="status">
                    <nz-option nzValue="pending" nzLabel="待处理"></nz-option>
                    <nz-option nzValue="in_progress" nzLabel="维修中"></nz-option>
                    <nz-option nzValue="completed" nzLabel="已完成"></nz-option>
                    <nz-option nzValue="cancelled" nzLabel="已取消"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>维修负责人</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="maintainer" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24">
              <nz-form-item>
                <nz-form-label>故障描述</nz-form-label>
                <nz-form-control>
                  <textarea nz-input formControlName="faultDescription" rows="3"></textarea>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24">
              <nz-form-item>
                <nz-form-label>维修内容/过程</nz-form-label>
                <nz-form-control>
                  <textarea nz-input formControlName="maintenanceContent" rows="3"></textarea>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>故障原因分析</nz-form-label>
                <nz-form-control>
                  <textarea nz-input formControlName="causeAnalysis" rows="2"></textarea>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>预防措施</nz-form-label>
                <nz-form-control>
                  <textarea nz-input formControlName="preventiveMeasures" rows="2"></textarea>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>停机时长(分钟)</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="downtimeMinutes" [nzMin]="0" style="width: 100%;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>人工费用(元)</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="laborCost" [nzMin]="0" [nzStep]="0.01" style="width: 100%;"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
          </nz-row>

          <div style="margin-top: 24px; text-align: center;">
            <button nz-button style="width: 120px;" (click)="router.navigate(['/maintenance'])">取消</button>
            <button nz-button nzType="primary" style="width: 120px; margin-left: 16px;" [nzLoading]="submitting">
              <i nz-icon nzType="save-outline"></i> 保存
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class MaintenanceFormComponent implements OnInit {
  isEdit = false;
  submitting = false;
  form: FormGroup;
  id = '';
  equipmentList: any[] = [];

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private message: NzMessageService,
    private service: MaintenanceService,
    private equipmentService: EquipmentService
  ) {
    this.form = this.fb.group({
      equipmentId: ['', [Validators.required]],
      maintenanceType: ['corrective'],
      status: ['pending'],
      maintainer: [''],
      reporter: [''],
      faultDescription: [''],
      maintenanceContent: [''],
      causeAnalysis: [''],
      preventiveMeasures: [''],
      downtimeMinutes: [0],
      laborCost: [0],
      remark: [''],
    });
  }

  ngOnInit(): void {
    this.equipmentService.listSimple().subscribe((res) => (this.equipmentList = res));

    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.isEdit = true;
      this.service.getById(this.id).subscribe((res) => {
        this.form.patchValue({
          equipmentId: res.equipmentId,
          maintenanceType: res.maintenanceType,
          status: res.status,
          maintainer: res.maintainer,
          reporter: res.reporter,
          faultDescription: res.faultDescription,
          maintenanceContent: res.maintenanceContent,
          causeAnalysis: res.causeAnalysis,
          preventiveMeasures: res.preventiveMeasures,
          downtimeMinutes: res.downtimeMinutes,
          laborCost: res.laborCost,
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
    const request = this.isEdit
      ? this.service.update(this.id, this.form.value)
      : this.service.create(this.form.value);

    request.subscribe({
      next: () => {
        this.message.success(this.isEdit ? '更新成功' : '创建成功');
        this.router.navigate(['/maintenance']);
        this.submitting = false;
      },
      error: () => (this.submitting = false),
    });
  }
}
