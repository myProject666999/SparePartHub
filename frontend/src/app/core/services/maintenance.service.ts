import { Injectable } from '@angular/core';
import { ApiService, PaginatedResponse } from '../services/api.service';
import { Observable } from 'rxjs';

export interface MaintenanceRecord {
  id: string;
  orderNo: string;
  equipmentId: string;
  maintenanceType: string;
  status: string;
  faultTime?: Date;
  startTime?: Date;
  endTime?: Date;
  downtimeMinutes: number;
  faultDescription?: string;
  maintenanceContent?: string;
  causeAnalysis?: string;
  preventiveMeasures?: string;
  sparePartCost: number;
  laborCost: number;
  totalCost: number;
  reporter?: string;
  maintainer?: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  equipment?: any;
  stockMovements?: any[];
}

export interface MaintenanceQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  equipmentId?: string;
  maintenanceType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  maintainer?: string;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  constructor(private api: ApiService) {}

  create(data: any): Observable<MaintenanceRecord> {
    return this.api.post<MaintenanceRecord>('/maintenance-records', data);
  }

  update(id: string, data: any): Observable<MaintenanceRecord> {
    return this.api.put<MaintenanceRecord>(`/maintenance-records/${id}`, data);
  }

  getById(id: string): Observable<any> {
    return this.api.get<any>(`/maintenance-records/${id}`);
  }

  getByOrderNo(orderNo: string): Observable<any> {
    return this.api.get<any>(`/maintenance-records/order/${orderNo}`);
  }

  list(params: MaintenanceQueryParams): Observable<PaginatedResponse<any>> {
    return this.api.get<PaginatedResponse<any>>('/maintenance-records', params);
  }

  getStats(startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>('/maintenance-records/stats/summary', { startDate, endDate });
  }
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  constructor(private api: ApiService) {}

  getDashboard(): Observable<any> {
    return this.api.get<any>('/statistics/dashboard');
  }

  getConsumptionByEquipment(startDate?: string, endDate?: string, topN?: number): Observable<any> {
    return this.api.get<any>('/statistics/consumption/equipment', { startDate, endDate, topN });
  }

  getConsumptionBySparePart(startDate?: string, endDate?: string, topN?: number): Observable<any> {
    return this.api.get<any>('/statistics/consumption/spare-part', { startDate, endDate, topN });
  }

  getConsumptionByCategory(startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>('/statistics/consumption/category', { startDate, endDate });
  }

  getConsumptionTrend(days?: number): Observable<any> {
    return this.api.get<any>('/statistics/consumption/trend', { days });
  }

  getEquipmentDetail(equipmentId: string, startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>(`/statistics/consumption/equipment/${equipmentId}`, { startDate, endDate });
  }
}
