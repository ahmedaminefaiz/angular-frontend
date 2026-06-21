import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiPage } from '../models/alert.models';
import { ProblemResponse } from '../models/problem.models';

@Injectable({ providedIn: 'root' })
export class ProblemsService {
  private readonly base = `${environment.apiUrl}/v1/problems`;

  constructor(private readonly http: HttpClient) {}

  getProblems(page = 0, size = 9): Observable<ApiPage<ProblemResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<ProblemResponse>>(this.base, { params });
  }

  getProblemsRelatedToMyAlerts(page = 0, size = 9): Observable<ApiPage<ProblemResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<ProblemResponse>>(`${this.base}/user/my-alert-problems`, { params });
  }
}
