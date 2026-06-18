import { Injectable } from '@angular/core';
import { ApiService, PaginatedResponse } from '../services/api.service';
import { Observable } from 'rxjs';

export interface SparePart {
  id: string;
  code: string;
  name: string;
  category: string;
  specification: string;
  brand?: string;
  manufacturer?: string;
  unitPrice: number;
  unit: string;
  storageLocation: string;
  safetyStock: number;
  purchaseQuantity: number;
  technicalParams?: string;
  remark?: string;
  isHot: boolean;
  barcode: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  currentStock?: number;
  inventory?: any;
  equipmentRelations?: any[];
}

export interface SparePartQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  status?: string;
  isHot?: boolean;
  equipmentId?: string;
}

@Injectable({ providedIn: 'root' })
export class SparePartService {
  constructor(private api: ApiService) {}

  create(data: Partial<SparePart>): Observable<SparePart> {
    return this.api.post<SparePart>('/spare-parts', data);
  }

  update(id: string, data: Partial<SparePart>): Observable<SparePart> {
    return this.api.put<SparePart>(`/spare-parts/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.api.delete<any>(`/spare-parts/${id}`);
  }

  getById(id: string): Observable<any> {
    return this.api.get<any>(`/spare-parts/${id}`);
  }

  getByCode(code: string): Observable<SparePart> {
    return this.api.get<SparePart>(`/spare-parts/code/${code}`);
  }

  getByBarcode(barcode: string): Observable<SparePart> {
    return this.api.get<SparePart>(`/spare-parts/barcode/${barcode}`);
  }

  list(params: SparePartQueryParams): Observable<PaginatedResponse<any>> {
    return this.api.get<PaginatedResponse<any>>('/spare-parts', params);
  }

  linkEquipment(id: string, equipmentIds: string[], installPosition?: string, usagePerEquipment?: number): Observable<any> {
    return this.api.post<any>(`/spare-parts/${id}/link-equipment`, {
      equipmentIds,
      installPosition,
      usagePerEquipment,
    });
  }

  unlinkEquipment(id: string, equipmentId: string): Observable<any> {
    return this.api.delete<any>(`/spare-parts/${id}/link-equipment/${equipmentId}`);
  }

  getLinkedEquipments(id: string): Observable<any[]> {
    return this.api.get<any[]>(`/spare-parts/${id}/linked-equipments`);
  }

  toggleHot(id: string): Observable<SparePart> {
    return this.api.put<SparePart>(`/spare-parts/${id}/toggle-hot`, {});
  }
}
