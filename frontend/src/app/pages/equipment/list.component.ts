import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EquipmentService } from '../../core/services/equipment.service';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  running: { label: '运行中', color: 'green' },
  standby: { label: '待机', color: 'blue' },
  maintenance: { label: '维修中', color: 'orange' },
  fault: { label: '故障', color: 'red' },
  scrapped: { label: '报废', color: 'default' },
};

@Component({
  selector: 'app-equipment-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>🔧 设备管理</h2>
        <div class="sub-title">设备台账维护，关联适用备件和维修记录</div>
      </div>

      <div class="card-section">
        <div class="toolbar">
          <div class="toolbar-left">
            <nz-input-group nzSearch [nzAddOnAfter]="searchIcon" style="width: 260px;">
              <input type="text" nz-input placeholder="搜索编号/名称/型号" [(ngModel)]="queryParams.keyword" (keyup.enter)="loadData()" />
              <ng-template #searchIcon>
                <button nz-button nzType="primary" nzSearch (click)="loadData()"><i nz-icon nzType="search" nzTheme="outline"></i></button>
              </ng-template>
            </nz-input-group>
            <nz-select style="width: 140px;" [(ngModel)]="queryParams.workshop" nzPlaceHolder="选择车间" nzAllowClear (ngModelChange)="loadData()">
              <nz-option nzValue="一车间" nzLabel="一车间"></nz-option>
              <nz-option nzValue="二车间" nzLabel="二车间"></nz-option>
              <nz-option nzValue="三车间" nzLabel="三车间"></nz-option>
              <nz-option nzValue="动力车间" nzLabel="动力车间"></nz-option>
            </nz-select>
            <nz-select style="width: 140px;" [(ngModel)]="queryParams.status" nzPlaceHolder="选择状态" nzAllowClear (ngModelChange)="loadData()">
              <nz-option *ngFor="let s of statusOptions" [nzValue]="s.value" [nzLabel]="s.label"></nz-option>
            </nz-select>
            <button nz-button (click)="resetQuery()"><i nz-icon nzType="reload" nzTheme="outline"></i> 重置</button>
          </div>
          <div class="toolbar-right">
            <button nz-button nzType="primary" (click)="router.navigate(['/equipments/new'])">
              <i nz-icon nzType="plus" nzTheme="outline"></i> 创建设备
            </button>
          </div>
        </div>

        <nz-table #table [nzData]="list" [nzLoading]="loading" [nzTotal]="total" [(nzPageIndex)]="queryParams.page"
          [(nzPageSize)]="queryParams.pageSize" (nzPageIndexChange)="loadData()" (nzPageSizeChange)="loadData()"
          nzShowSizeChanger nzShowQuickJumper nzFrontPagination="false">
          <thead>
            <tr>
              <th style="width: 80px;">操作</th>
              <th>设备编号</th>
              <th>设备名称</th>
              <th>型号</th>
              <th style="width: 110px;">车间/产线</th>
              <th style="width: 90px;">状态</th>
              <th style="width: 120px;">负责人</th>
              <th style="width: 90px;">维修次数</th>
              <th style="width: 130px;">备件消耗金额</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of list">
              <td>
                <a (click)="router.navigate(['/equipments/edit', item.id])">编辑</a>
              </td>
              <td><b>{{ item.code }}</b></td>
              <td>{{ item.name }}</td>
              <td style="color: #595959;">{{ item.model || '-' }}</td>
              <td>{{ item.workshop || '-' }}</td>
              <td><nz-tag [nzColor]="STATUS_MAP[item.status]?.color">{{ STATUS_MAP[item.status]?.label }}</nz-tag></td>
              <td>{{ item.responsiblePerson || '-' }}</td>
              <td>{{ item.maintenanceCount || 0 }}</td>
              <td>¥{{ (item.totalSparePartCost || 0) | number : '1.2-2' }}</td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
})
export class EquipmentListComponent implements OnInit {
  STATUS_MAP = STATUS_MAP;
  statusOptions = [
    { value: 'running', label: '运行中' },
    { value: 'standby', label: '待机' },
    { value: 'maintenance', label: '维修中' },
    { value: 'fault', label: '故障' },
    { value: 'scrapped', label: '报废' },
  ];

  loading = false;
  list: any[] = [];
  total = 0;
  queryParams: any = { page: 1, pageSize: 20, keyword: '', workshop: '', status: '' };

  constructor(public router: Router, private equipmentService: EquipmentService, private message: NzMessageService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.equipmentService.list(this.queryParams).subscribe({
      next: (res) => {
        this.list = res.list;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  resetQuery(): void {
    this.queryParams = { page: 1, pageSize: 20, keyword: '', workshop: '', status: '' };
    this.loadData();
  }
}

@Component({
  selector: 'app-equipment-form',
  template: `
    <div class="page-container">
      <div class="page-header">
        <button nz-button (click)="router.navigate(['/equipments'])"><i nz-icon nzType="arrow-left" nzTheme="outline"></i> 返回</button>
        <span style="margin-left: 16px; font-size: 20px; font-weight: 600;">{{ isEdit ? '编辑设备' : '创建设备' }}</span>
      </div>

      <div class="card-section">
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="submit()">
          <nz-row [nzGutter]="24">
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label nzRequired>设备名称</nz-form-label>
                <nz-form-control nzErrorTip="请输入设备名称">
                  <input nz-input formControlName="name" placeholder="例如：1号空压机" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>设备类别</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="category" nzAllowClear>
                    <nz-option nzValue="空压机" nzLabel="空压机"></nz-option>
                    <nz-option nzValue="电机组" nzLabel="电机组"></nz-option>
                    <nz-option nzValue="输送机" nzLabel="输送机"></nz-option>
                    <nz-option nzValue="泵类" nzLabel="泵类"></nz-option>
                    <nz-option nzValue="机床" nzLabel="机床"></nz-option>
                    <nz-option nzValue="其他" nzLabel="其他"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>设备型号</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="model" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>所属车间/产线</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="workshop" nzAllowClear>
                    <nz-option nzValue="一车间" nzLabel="一车间"></nz-option>
                    <nz-option nzValue="二车间" nzLabel="二车间"></nz-option>
                    <nz-option nzValue="三车间" nzLabel="三车间"></nz-option>
                    <nz-option nzValue="动力车间" nzLabel="动力车间"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>安装位置</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="location" placeholder="例如：厂房A区-北侧" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>设备状态</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="status">
                    <nz-option *ngFor="let s of statusOptions" [nzValue]="s.value" [nzLabel]="s.label"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>负责人</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="responsiblePerson" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzXs]="24" [nzMd]="12">
              <nz-form-item>
                <nz-form-label>联系电话</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="contactPhone" />
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

          <div style="margin-top: 24px; text-align: center;">
            <button nz-button style="width: 120px;" (click)="router.navigate(['/equipments'])">取消</button>
            <button nz-button nzType="primary" style="width: 120px; margin-left: 16px;" [nzLoading]="submitting">
              <i nz-icon nzType="save" nzTheme="outline"></i> 保存
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class EquipmentFormComponent implements OnInit {
  statusOptions = [
    { value: 'running', label: '运行中' },
    { value: 'standby', label: '待机' },
    { value: 'maintenance', label: '维修中' },
    { value: 'fault', label: '故障' },
    { value: 'scrapped', label: '报废' },
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
    private equipmentService: EquipmentService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      category: [''],
      model: [''],
      workshop: [''],
      location: [''],
      commissionDate: [''],
      status: ['running'],
      responsiblePerson: [''],
      contactPhone: [''],
      remark: [''],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.isEdit = true;
      this.equipmentService.getById(this.id).subscribe((res) => {
        this.form.patchValue({
          name: res.name,
          category: res.category,
          model: res.model,
          workshop: res.workshop,
          location: res.location,
          status: res.status,
          responsiblePerson: res.responsiblePerson,
          contactPhone: res.contactPhone,
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
    const data = { ...this.form.value };
    if (!data.commissionDate) {
      delete data.commissionDate;
    }
    const request = this.isEdit
      ? this.equipmentService.update(this.id, data)
      : this.equipmentService.create(data);

    request.subscribe({
      next: () => {
        this.message.success(this.isEdit ? '更新成功' : '创建成功');
        this.router.navigate(['/equipments']);
        this.submitting = false;
      },
      error: () => (this.submitting = false),
    });
  }
}
