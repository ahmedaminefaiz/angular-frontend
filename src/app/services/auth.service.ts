import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, SignupRequest, VerifyPhoneRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiUrl}/v1/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, credentials);
  }

  register(data: SignupRequest): Observable<string> {
    return this.http.post(`${this.base}/register`, data, { responseType: 'text' });
  }

  verifyPhone(request: VerifyPhoneRequest): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.base}/verify-phone`, request, { observe: 'response' });
  }
}
