import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item } from '../models/item.model';
import { Order, OrderNote, CreateOrderPayload, CreateOrderResponse } from '../models/order.model';
import { LanguageService } from './language.service';

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
  private readonly langService = inject(LanguageService);

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Language': this.langService.currentLanguage(),
    });
  }

  // --- PUBLIC ENDPOINTS ---
  getPaymentMethods(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/payment-methods`, {
      headers: this.getHeaders(),
    });
  }

  getPublicCategories(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/categories`, {
      headers: this.getHeaders(),
    });
  }

  getPublicItems(category?: string): Observable<ApiResponse<Item[]>> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<ApiResponse<Item[]>>(`${this.baseUrl}/items`, {
      params,
      headers: this.getHeaders(),
    });
  }

  getPublicItemById(id: string): Observable<ApiResponse<Item>> {
    return this.http.get<ApiResponse<Item>>(`${this.baseUrl}/items/${id}`, {
      headers: this.getHeaders(),
    });
  }

  submitOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.baseUrl}/orders`, payload);
  }

  getOrderStatus(orderId: string, sessionId?: string): Observable<ApiResponse<Order>> {
    let params = new HttpParams();
    if (sessionId) {
      params = params.set('session_id', sessionId);
    }
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/orders/${orderId}/status`, { params });
  }

  // --- MANAGER ENDPOINTS ---
  getManagerCategories(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/manager/categories`);
  }

  getManagerItems(): Observable<ApiResponse<Item[]>> {
    return this.http.get<ApiResponse<Item[]>>(`${this.baseUrl}/manager/items`);
  }

  getManagerItemById(id: string): Observable<ApiResponse<Item>> {
    return this.http.get<ApiResponse<Item>>(`${this.baseUrl}/manager/items/${id}`);
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

  getManagerOrders(status?: string, paymentStatus?: string): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (paymentStatus) {
      params = params.set('paymentStatus', paymentStatus);
    }
    return this.http.get<ApiResponse<Order[]>>(`${this.baseUrl}/manager/orders`, { params });
  }

  updateManagerOrder(
    id: string,
    update: { status?: 'opened' | 'closed'; notes?: string | OrderNote[] }
  ): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.baseUrl}/manager/orders/${id}`, update);
  }
}
