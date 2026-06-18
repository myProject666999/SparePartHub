import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzListModule } from 'ng-zorro-antd/list';

import {
  AppstoreOutline,
  DashboardOutline,
  FormOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  SearchOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  SaveOutline,
  CloseOutline,
  EyeOutline,
  DownloadOutline,
  UploadOutline,
  InboxOutline,
  ShoppingOutline,
  ToolOutline,
  BarChartOutline,
  TableOutline,
  ScanOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  ExclamationCircleOutline,
  CheckCircleOutline,
  ClockCircleOutline,
  UserOutline,
  SettingOutline,
  ReloadOutline,
  PrinterOutline,
  FilterOutline,
  ExportOutline,
  ImportOutline,
  LinkOutline,
  AlertOutline,
  HomeOutline,
  TeamOutline,
  ShopOutline,
  ReconciliationOutline,
  RocketOutline,
  ThunderboltOutline,
  TagOutline,
  ContainerOutline,
  QrcodeOutline,
  SafetyCertificateOutline,
  ScheduleOutline,
  InfoCircleOutline,
  RedoOutline,
  UndoOutline,
} from '@ant-design/icons-angular/icons';

import { NgxEchartsModule } from 'ngx-echarts';

import { ApiInterceptor } from './core/interceptors/api.interceptor';
import { NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';

import { AppComponent } from './app.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SparePartListComponent, SparePartFormComponent } from './pages/spare-part/list.component';
import { EquipmentListComponent, EquipmentFormComponent } from './pages/equipment/list.component';
import { InventoryListComponent, StockInComponent, StockOutComponent, ScanOutComponent } from './pages/inventory/list.component';
import { StockMovementListComponent } from './pages/stock-movement/list.component';
import { PurchaseSuggestionListComponent } from './pages/purchase-suggestion/list.component';
import { MaintenanceListComponent, MaintenanceFormComponent } from './pages/maintenance/list.component';
import { StatisticsComponent } from './pages/statistics/statistics.component';

registerLocaleData(zh);

const icons = [
  AppstoreOutline,
  DashboardOutline,
  FormOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  SearchOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  SaveOutline,
  CloseOutline,
  EyeOutline,
  DownloadOutline,
  UploadOutline,
  InboxOutline,
  ShoppingOutline,
  ToolOutline,
  BarChartOutline,
  TableOutline,
  ScanOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  ExclamationCircleOutline,
  CheckCircleOutline,
  ClockCircleOutline,
  UserOutline,
  SettingOutline,
  ReloadOutline,
  PrinterOutline,
  FilterOutline,
  ExportOutline,
  ImportOutline,
  LinkOutline,
  AlertOutline,
  HomeOutline,
  TeamOutline,
  ShopOutline,
  ReconciliationOutline,
  RocketOutline,
  ThunderboltOutline,
  TagOutline,
  ContainerOutline,
  QrcodeOutline,
  SafetyCertificateOutline,
  ScheduleOutline,
  InfoCircleOutline,
  RedoOutline,
  UndoOutline,
];

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
      { path: 'dashboard', component: DashboardComponent, title: '数据看板' },
      { path: 'spare-parts', component: SparePartListComponent, title: '备件管理' },
      { path: 'spare-parts/new', component: SparePartFormComponent, title: '新建备件' },
      { path: 'spare-parts/edit/:id', component: SparePartFormComponent, title: '编辑备件' },
      { path: 'equipments', component: EquipmentListComponent, title: '设备管理' },
      { path: 'equipments/new', component: EquipmentFormComponent, title: '创建设备' },
      { path: 'equipments/edit/:id', component: EquipmentFormComponent, title: '编辑设备' },
      { path: 'inventory', component: InventoryListComponent, title: '库存管理' },
      { path: 'inventory/stock-in', component: StockInComponent, title: '采购入库' },
      { path: 'inventory/stock-out', component: StockOutComponent, title: '维修领料' },
      { path: 'inventory/scan-out', component: ScanOutComponent, title: '扫码出库' },
      { path: 'stock-movements', component: StockMovementListComponent, title: '出入库流水' },
      { path: 'purchase-suggestions', component: PurchaseSuggestionListComponent, title: '请购建议' },
      { path: 'maintenance', component: MaintenanceListComponent, title: '维修记录' },
      { path: 'maintenance/new', component: MaintenanceFormComponent, title: '新建维修记录' },
      { path: 'maintenance/edit/:id', component: MaintenanceFormComponent, title: '编辑维修记录' },
      { path: 'statistics', component: StatisticsComponent, title: '统计分析' },
    ],
  },
];

const zorroModules = [
  NzButtonModule,
  NzInputModule,
  NzFormModule,
  NzTableModule,
  NzModalModule,
  NzSelectModule,
  NzDatePickerModule,
  NzMessageModule,
  NzNotificationModule,
  NzLayoutModule,
  NzMenuModule,
  NzBreadCrumbModule,
  NzCardModule,
  NzTagModule,
  NzBadgeModule,
  NzPaginationModule,
  NzRadioModule,
  NzCheckboxModule,
  NzSwitchModule,
  NzInputNumberModule,
  NzDescriptionsModule,
  NzDividerModule,
  NzDrawerModule,
  NzPopconfirmModule,
  NzToolTipModule,
  NzSpaceModule,
  NzGridModule,
  NzStatisticModule,
  NzProgressModule,
  NzEmptyModule,
  NzSpinModule,
  NzAvatarModule,
  NzDropDownModule,
  NzUploadModule,
  NzListModule,
];

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    DashboardComponent,
    SparePartListComponent,
    SparePartFormComponent,
    EquipmentListComponent,
    EquipmentFormComponent,
    InventoryListComponent,
    StockInComponent,
    StockOutComponent,
    ScanOutComponent,
    StockMovementListComponent,
    PurchaseSuggestionListComponent,
    MaintenanceListComponent,
    MaintenanceFormComponent,
    StatisticsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    ...zorroModules,
    NzIconModule.forRoot(icons),
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ],
  providers: [
    { provide: NZ_I18N, useValue: zh_CN },
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class AppModule {}
