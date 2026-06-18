import { Injectable } from '@angular/core';
import { ApiService, PaginatedResponse } from '../services/api.service';
import { Observable } from 'rxjs';

export interface PurchaseSuggestion {
  id: string;
  suggestionNo: string;
  sparePartId: string;
  currentStock: number;
  safetyStock: number;
  suggestedQuantity: number;
  orderedQuantity: number;
  gapQuantity: number;
  monthlyConsumption?: number;
  estimatedDaysLeft?: number;
  isUrgent: boolean;
  status: string;
  expectedDeliveryDate?: Date;
  purchaseOrderNo?: string;
  approver?: string;
  approvalTime?: Date;
  approvalRemark?: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  sparePart?: any;
}

export interface PurchaseSuggestionQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  isUrgent?: boolean;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseSuggestionService {
  constructor(private api: ApiService) {}

  generate(isHot?: boolean, category?: string): Observable<PurchaseSuggestion[]> {
    return this.api.post<PurchaseSuggestion[]>('/purchase-suggestions/generate', { isHot, category });
  }

  list(params: PurchaseSuggestionQueryParams): Observable<PaginatedResponse<any>> {
    return this.api.get<PaginatedResponse<any>>('/purchase-suggestions', params);
  }

  getById(id: string): Observable<any> {
    return this.api.get<any>(`/purchase-suggestions/${id}`);
  }

  approve(id: string, status: string, approver?: string, approvalRemark?: string): Observable<PurchaseSuggestion> {
    return this.api.put<PurchaseSuggestion>(`/purchase-suggestions/${id}/approve`, {
      status,
      approver,
      approvalRemark,
    });
  }

  linkPurchaseOrder(
    id: string,
    purchaseOrderNo: string,
    orderedQuantity: number,
    expectedDeliveryDate?: string
  ): Observable<PurchaseSuggestion> {
    return this.api.put<PurchaseSuggestion>(`/purchase-suggestions/${id}/link-purchase-order`, {
      purchaseOrderNo,
      orderedQuantity,
      expectedDeliveryDate,
    });
  }

  markCompleted(id: string): Observable<PurchaseSuggestion> {
    return this.api.put<PurchaseSuggestion>(`/purchase-suggestions/${id}/complete`, {});
  }

  delete(id: string): Observable<any> {
    return this.api.delete<any>(`/purchase-suggestions/${id}`);
  }

  getStats(): Observable<any> {
    return this.api.get<any>('/purchase-suggestions/stats/summary');
  }
}
