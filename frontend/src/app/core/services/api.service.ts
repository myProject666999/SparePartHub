import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  timestamp?: number;
}

export interface PaginatedResponse<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private extractData<T>(res: ApiResponse<T>): T {
    return res.data as T;
  }

  get<T>(url: string, params?: any): Observable<T> {
    return this.http.get<ApiResponse<T>>(url, { params }).pipe(map(this.extractData));
  }

  post<T>(url: string, body?: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(url, body).pipe(map(this.extractData));
  }

  put<T>(url: string, body?: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(url, body).pipe(map(this.extractData));
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(url).pipe(map(this.extractData));
  }
}
