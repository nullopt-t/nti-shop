import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'nti_manager_token_v1';
  private readonly baseUrl = '/api/manager';

  readonly token = signal<string | null>(this.getStoredToken());
  readonly isAuthenticated = computed(() => !!this.token());

  constructor(private http: HttpClient) {}

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  login(accessKey: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth`, { accessKey }).pipe(
      tap((res) => {
        if (res.success && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.token.set(res.token);
        }
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.token.set(null);
  }
}
