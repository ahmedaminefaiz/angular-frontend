import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiPage } from '../models/alert.models';
import {
  CreateInterventionRequest,
  CreateInterventionUpdateRequest,
  InterventionResponse,
  InterventionUpdateResponse
} from '../models/intervention.models';

@Injectable({ providedIn: 'root' })
export class InterventionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/interventions`;

  create(request: CreateInterventionRequest): Observable<InterventionResponse> {
    return this.http.post<InterventionResponse>(this.base, request);
  }

  getMyInterventions(page = 0, size = 10): Observable<ApiPage<InterventionResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<InterventionResponse>>(`${this.base}/my-interventions`, { params });
  }

  getByProblem(problemId: number, page = 0, size = 10): Observable<ApiPage<InterventionResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<InterventionResponse>>(`${this.base}/problem/${problemId}`, { params });
  }

  getById(id: number): Observable<InterventionResponse> {
    return this.http.get<InterventionResponse>(`${this.base}/${id}`);
  }

  update(id: number, request: CreateInterventionUpdateRequest): Observable<InterventionResponse> {
    return this.http.patch<InterventionResponse>(`${this.base}/${id}`, request);
  }

  createUpdate(id: number, request: CreateInterventionUpdateRequest): Observable<InterventionResponse> {
    return this.http.post<InterventionResponse>(`${this.base}/${id}/updates`, request);
  }

  getUpdates(id: number): Observable<InterventionUpdateResponse[]> {
    return this.http.get<InterventionUpdateResponse[]>(`${this.base}/${id}/updates`);
  }

  addPhoto(id: number, mediaUrl: string): Observable<InterventionResponse> {
    return this.http.post<InterventionResponse>(`${this.base}/${id}/photos`, { mediaUrl });
  }

  removePhoto(id: number, photoUrl: string): Observable<InterventionResponse> {
    const params = new HttpParams().set('photoUrl', photoUrl);
    return this.http.delete<InterventionResponse>(`${this.base}/${id}/photos`, { params });
  }

  close(id: number): Observable<InterventionResponse> {
    return this.http.patch<InterventionResponse>(`${this.base}/${id}/close`, {});
  }
}
