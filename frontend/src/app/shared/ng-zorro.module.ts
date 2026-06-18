import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...zorroModules,
    NzIconModule.forRoot(icons),
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...zorroModules,
    NzIconModule,
  ],
})
export class NgZorroAntdModule {}
