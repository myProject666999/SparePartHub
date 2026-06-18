import { Injectable } from '@angular/core';
import { ApiService, PaginatedResponse } from '../services/api.service';
import { Observable } from 'rxjs';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  model?: string;
  category?: string;
  workshop?: string;
  location?: string;
  commissionDate?: Date;
  maintenanceCount: number;
  totalSparePartCost: number;
  status: string;
  responsiblePerson?: string;
  contactPhone?: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  sparePartRelations?: any[];
}

export interface EquipmentQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  workshop?: string;
  status?: string;
  sparePartId?: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  constructor(private api: ApiService) {}

  create(data: Partial<Equipment>): Observable<Equipment> {
    return this.api.post<Equipment>('/equipments', data);
  }

  update(id: string, data: Partial<Equipment>): Observable<Equipment> {
    return this.api.put<Equipment>(`/equipments/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.api.delete<any>(`/equipments/${id}`);
  }

  getById(id: string): Observable<any> {
    return this.api.get<any>(`/equipments/${id}`);
  }

  list(params: EquipmentQueryParams): Observable<PaginatedResponse<Equipment>> {
    return this.api.get<PaginatedResponse<Equipment>>('/equipments', params);
  }

  listSimple(): Observable<any[]> {
    return this.api.get<any[]>('/equipments/simple/all');
  }

  updateStatus(id: string, status: string): Observable<Equipment> {
    return this.api.put<Equipment>(`/equipments/${id}/status/${status}`, {});
  }
}
