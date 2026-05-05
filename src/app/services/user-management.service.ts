import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserSummaryResponse } from '../models/user-management.models';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private base = `${environment.apiUrl}/v1/management`;

  constructor(private http: HttpClient) {}

  getPendingAgents(): Observable<UserSummaryResponse[]> {
    return this.http.get<UserSummaryResponse[]>(`${this.base}/agents/pending`);
  }

  approveAgent(id: number): Observable<string> {
    return this.http.post(`${this.base}/agents/${id}/approve`, {}, { responseType: 'text' });
  }

  rejectAgent(id: number): Observable<string> {
    return this.http.post(`${this.base}/agents/${id}/reject`, {}, { responseType: 'text' });
  }

  getPendingSuperAgents(): Observable<UserSummaryResponse[]> {
    return this.http.get<UserSummaryResponse[]>(`${this.base}/super-agents/pending`);
  }

  approveSuperAgent(id: number): Observable<string> {
    return this.http.post(`${this.base}/super-agents/${id}/approve`, {}, { responseType: 'text' });
  }

  rejectSuperAgent(id: number): Observable<string> {
    return this.http.post(`${this.base}/super-agents/${id}/reject`, {}, { responseType: 'text' });
  }
}
