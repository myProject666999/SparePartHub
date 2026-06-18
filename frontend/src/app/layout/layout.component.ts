import { Component } from '@angular/core';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-layout',
  template: `
    <nz-layout style="min-height: 100vh;">
      <nz-sider nzCollapsible [(nzCollapsed)]="isCollapsed" [nzWidth]="240">
        <div class="logo">
          <span *ngIf="!isCollapsed">
            <i nz-icon nzType="container-outline" style="font-size: 24px; color: #fff;"></i>
            <span style="margin-left: 10px; font-size: 18px; font-weight: 600; color: #fff;">备品备件中心</span>
          </span>
          <i *ngIf="isCollapsed" nz-icon nzType="container-outline" style="font-size: 28px; color: #fff; display: block; text-align: center;"></i>
        </div>
        <ul nz-menu nzTheme="dark" nzMode="inline" [nzInlineCollapsed]="isCollapsed" nzInlineIndent="24">
          <ng-container *ngFor="let menu of menus">
            <li nz-menu-item *ngIf="!menu.children" nzMatchRouter [routerLink]="menu.path">
              <i nz-icon [nzType]="menu.icon"></i>
              <span>{{ menu.label }}</span>
            </li>
            <li nz-submenu *ngIf="menu.children" nzTitle="{{ menu.label }}">
              <span title><i nz-icon [nzType]="menu.icon"></i><span>{{ menu.label }}</span></span>
              <ul>
                <li nz-menu-item *ngFor="let child of menu.children" nzMatchRouter [routerLink]="child.path">
                  <i nz-icon [nzType]="child.icon"></i>
                  <span>{{ child.label }}</span>
                </li>
              </ul>
            </li>
          </ng-container>
        </ul>
      </nz-sider>
      <nz-layout>
        <nz-header style="background: #fff; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
          <div style="display: flex; align-items: center; gap: 16px;">
            <h3 style="margin: 0; font-size: 16px;">{{ currentTitle }}</h3>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #8c8c8c; font-size: 13px;">{{ currentDate }}</span>
            <nz-avatar nzIcon="user" style="background-color: #1890ff;"></nz-avatar>
            <span>管理员</span>
          </div>
        </nz-header>
        <nz-content style="margin: 0; padding: 0;">
          <router-outlet></router-outlet>
        </nz-content>
        <nz-footer style="text-align: center; color: #8c8c8c; padding: 16px;">
          备品备件库存管理系统 ©{{ year }} Powered by NestJS + Angular
        </nz-footer>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .logo {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      margin: 0;
    }
  `],
})
export class LayoutComponent {
  isCollapsed = false;
  year = new Date().getFullYear();
  currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  menuTitles: Record<string, string> = {
    dashboard: '数据看板',
    'spare-parts': '备件档案管理',
    equipments: '设备台账管理',
    inventory: '库存管理',
    'stock-movements': '出入库流水',
    'purchase-suggestions': '请购建议',
    maintenance: '维修记录',
    statistics: '统计分析',
  };

  menus: MenuItem[] = [
    { label: '数据看板', path: '/dashboard', icon: 'dashboard-outline' },
    {
      label: '基础档案',
      path: '',
      icon: 'appstore-outline',
      children: [
        { label: '备件管理', path: '/spare-parts', icon: 'tag-outline' },
        { label: '设备管理', path: '/equipments', icon: 'tool-outline' },
      ],
    },
    {
      label: '库存管理',
      path: '',
      icon: 'container-outline',
      children: [
        { label: '库存查询', path: '/inventory', icon: 'search-outline' },
        { label: '采购入库', path: '/inventory/stock-in', icon: 'arrow-up-outline' },
        { label: '维修领料', path: '/inventory/stock-out', icon: 'arrow-down-outline' },
        { label: '扫码出库', path: '/inventory/scan-out', icon: 'scan-outline' },
      ],
    },
    { label: '出入库流水', path: '/stock-movements', icon: 'reconciliation-outline' },
    { label: '请购建议', path: '/purchase-suggestions', icon: 'shopping-outline' },
    { label: '维修记录', path: '/maintenance', icon: 'safety-certificate-outline' },
    { label: '统计分析', path: '/statistics', icon: 'bar-chart-outline' },
  ];

  get currentTitle(): string {
    const path = location.hash.slice(1) || '/dashboard';
    for (const menu of this.menus) {
      if (menu.path && path.startsWith(menu.path)) {
        return this.menuTitles[menu.path.split('/')[1]] || menu.label;
      }
      if (menu.children) {
        for (const child of menu.children) {
          if (path.startsWith(child.path)) {
            return child.label;
          }
        }
      }
    }
    return '数据看板';
  }
}
