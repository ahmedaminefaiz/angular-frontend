import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { KpiDashboard, KpiFilters } from '../models/kpi.models';

@Injectable({ providedIn: 'root' })
export class KpiService {
  private readonly base = `${environment.apiUrl}/v1/kpis`;

  constructor(private readonly http: HttpClient) {}

  getDashboard(filters: KpiFilters): Observable<KpiDashboard> {
    let params = new HttpParams();
    if (filters.periodDays != null) params = params.set('periodDays', String(filters.periodDays));
    if (filters.agentId != null) params = params.set('agentId', String(filters.agentId));
    return this.http.get<KpiDashboard>(`${this.base}/dashboard`, { params });
  }
}