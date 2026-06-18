import { Injectable } from '@angular/core';
import { ApiService, PaginatedResponse } from '../services/api.service';
import { Observable } from 'rxjs';

export interface Inventory {
  id: string;
  sparePartId: string;
  currentStock: number;
  allocatedStock: number;
  inTransitStock: number;
  monthlyConsumption: number;
  totalInbound: number;
  totalOutbound: number;
  inventoryValue: number;
  lastInboundAt?: Date;
  lastOutboundAt?: Date;
  lastStocktakeAt?: Date;
  sparePart?: any;
  isLowStock?: boolean;
}

export interface StockInData {
  sparePartId: string;
  quantity: number;
  relatedOrderNo?: string;
  supplierName?: string;
  operator?: string;
  unitPrice?: number;
  remark?: string;
}

export interface StockOutData {
  sparePartId: string;
  quantity: number;
  equipmentId: string;
  maintenanceRecordId?: string;
  operator?: string;
  department?: string;
  remark?: string;
}

export interface ScanStockOutData {
  barcode: string;
  quantity: number;
  equipmentCode: string;
  maintenanceOrderNo?: string;
  operator?: string;
  remark?: string;
}

export interface StockAdjustData {
  sparePartId: string;
  actualStock: number;
  operator?: string;
  remark?: string;
}

export interface InventoryQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  onlyLowStock?: boolean;
  onlyHot?: boolean;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private api: ApiService) {}

  stockIn(data: StockInData): Observable<any> {
    return this.api.post<any>('/inventory/stock-in', data);
  }

  stockOut(data: StockOutData): Observable<any> {
    return this.api.post<any>('/inventory/stock-out', data);
  }

  scanStockOut(data: ScanStockOutData): Observable<any> {
    return this.api.post<any>('/inventory/scan-stock-out', data);
  }

  stockAdjust(data: StockAdjustData): Observable<any> {
    return this.api.post<any>('/inventory/adjust', data);
  }

  getBySparePart(sparePartId: string): Observable<any> {
    return this.api.get<any>(`/inventory/spare-part/${sparePartId}`);
  }

  list(params: InventoryQueryParams): Observable<PaginatedResponse<any>> {
    return this.api.get<PaginatedResponse<any>>('/inventory/list', params);
  }

  getLowStock(): Observable<any[]> {
    return this.api.get<any[]>('/inventory/low-stock');
  }

  getStats(): Observable<any> {
    return this.api.get<any>('/inventory/stats');
  }
}
