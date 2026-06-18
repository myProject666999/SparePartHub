import { Injectable } from '@angular/core';
import { ApiService, PaginatedResponse } from '../services/api.service';
import { Observable } from 'rxjs';

export interface StockMovement {
  id: string;
  orderNo: string;
  sparePartId: string;
  movementType: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  unitPrice: number;
  totalAmount: number;
  relatedOrderNo?: string;
  maintenanceRecordId?: string;
  equipmentId?: string;
  supplierName?: string;
  operator?: string;
  department?: string;
  status: string;
  remark?: string;
  createdAt: Date;
  sparePart?: any;
  equipmentCode?: string;
  equipmentName?: string;
}

export interface StockMovementQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sparePartId?: string;
  equipmentId?: string;
  movementType?: string;
  startDate?: string;
  endDate?: string;
  operator?: string;
}

@Injectable({ providedIn: 'root' })
export class StockMovementService {
  constructor(private api: ApiService) {}

  list(params: StockMovementQueryParams): Observable<PaginatedResponse<any>> {
    return this.api.get<PaginatedResponse<any>>('/stock-movements', params);
  }

  getById(id: string): Observable<any> {
    return this.api.get<any>(`/stock-movements/${id}`);
  }

  getByOrderNo(orderNo: string): Observable<any> {
    return this.api.get<any>(`/stock-movements/order/${orderNo}`);
  }

  getTraceList(sparePartId: string): Observable<any[]> {
    return this.api.get<any[]>(`/stock-movements/trace/${sparePartId}`);
  }

  getStats(startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>('/stock-movements/stats/summary', { startDate, endDate });
  }
}
