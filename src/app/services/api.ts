import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, SignupRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private apiUrl = 'http://ebd2-springbootappprod-0yzlxj-8fd11f-192-166-204-204.traefik.me/api'; // Your Spring Boot base URL

  constructor(private http: HttpClient) {}

  getHello(): Observable<string> {
    return this.http.get(this.apiUrl + '/hello', { responseType: 'text' });
  }

  login(credentials: LoginRequest): Observable<string> {
    return this.http.post(this.apiUrl + '/auth/login', credentials, { responseType: 'text' });
  }

  signup(data: SignupRequest): Observable<string> {
    return this.http.post(this.apiUrl + '/auth/register', data, { responseType: 'text' });
  }
}
