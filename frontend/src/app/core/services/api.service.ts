import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item } from '../models/item.model';
import { Order, CreateOrderPayload, CreateOrderResponse } from '../models/order.model';

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // --- PUBLIC ENDPOINTS ---
  getPublicCategories(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/categories`);
  }

  getPublicItems(category?: string): Observable<ApiResponse<Item[]>> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<ApiResponse<Item[]>>(`${this.baseUrl}/items`, { params });
  }

  getPublicItemById(id: string): Observable<ApiResponse<Item>> {
    return this.http.get<ApiResponse<Item>>(`${this.baseUrl}/items/${id}`);
  }

  submitOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.baseUrl}/orders`, payload);
  }

  // --- MANAGER ENDPOINTS ---
  getManagerCategories(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/manager/categories`);
  }

  getManagerItems(): Observable<ApiResponse<Item[]>> {
    return this.http.get<ApiResponse<Item[]>>(`${this.baseUrl}/manager/items`);
  }

  createManagerItem(data: Partial<Item>): Observable<ApiResponse<Item>> {
    return this.http.post<ApiResponse<Item>>(`${this.baseUrl}/manager/items`, data);
  }

  updateManagerItem(id: string, data: Partial<Item>): Observable<ApiResponse<Item>> {
    return this.http.put<ApiResponse<Item>>(`${this.baseUrl}/manager/items/${id}`, data);
  }

  deleteManagerItem(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/manager/items/${id}`);
  }

  uploadImage(file: File): Observable<{ success: boolean; imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ success: boolean; imageUrl: string }>(`${this.baseUrl}/manager/upload`, formData);
  }

  getManagerOrders(status?: string): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<ApiResponse<Order[]>>(`${this.baseUrl}/manager/orders`, { params });
  }

  updateManagerOrder(
    id: string,
    update: { status?: 'opened' | 'closed'; notes?: string }
  ): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.baseUrl}/manager/orders/${id}`, update);
  }
}
