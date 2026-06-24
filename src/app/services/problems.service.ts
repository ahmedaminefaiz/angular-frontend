import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiPage } from '../models/alert.models';
import {
  CreateProblemRequest,
  ProblemResponse,
  ProblemStatusChangeRequest,
  UpdateProblemRequest
} from '../models/problem.models';

@Injectable({ providedIn: 'root' })
export class ProblemsService {
  private readonly base = `${environment.apiUrl}/v1/problems`;

  constructor(private readonly http: HttpClient) {}

  getProblemById(id: number): Observable<ProblemResponse> {
    return this.http.get<ProblemResponse>(`${this.base}/${id}`);
  }

  getProblems(page = 0, size = 9): Observable<ApiPage<ProblemResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<ProblemResponse>>(this.base, { params });
  }

  getMyProblems(page = 0, size = 9): Observable<ApiPage<ProblemResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<ProblemResponse>>(`${this.base}/user/my-problems`, { params });
  }

  getProblemsRelatedToMyAlerts(page = 0, size = 9): Observable<ApiPage<ProblemResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<ProblemResponse>>(`${this.base}/user/my-problems`, { params });
  }

  getAssignedProblems(page = 0, size = 10): Observable<ApiPage<ProblemResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<ProblemResponse>>(`${this.base}/assigned-to-me`, { params });
  }

  createProblem(payload: CreateProblemRequest): Observable<ProblemResponse> {
    return this.http.post<ProblemResponse>(this.base, payload);
  }

  updateProblem(id: number, payload: UpdateProblemRequest): Observable<ProblemResponse> {
    return this.http.put<ProblemResponse>(`${this.base}/${id}`, payload);
  }

  deleteProblem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  changeStatus(id: number, payload: ProblemStatusChangeRequest): Observable<ProblemResponse> {
    return this.http.patch<ProblemResponse>(`${this.base}/${id}/status`, payload);
  }

  addAlertToProblem(problemId: number, alertId: number): Observable<ProblemResponse> {
    return this.http.post<ProblemResponse>(`${this.base}/${problemId}/alerts/${alertId}`, {});
  }

  removeAlertFromProblem(problemId: number, alertId: number): Observable<ProblemResponse> {
    return this.http.delete<ProblemResponse>(`${this.base}/${problemId}/alerts/${alertId}`);
  }
}
