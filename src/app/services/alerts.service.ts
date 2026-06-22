import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AddMediaRequest,
  AlertResponse,
  ApiPage,
  CreateAlertRequest,
  UpdateAlertRequest
} from '../models/alert.models';

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly base = `${environment.apiUrl}/v1/alerts`;

  constructor(private readonly http: HttpClient) { }

  getAlerts(page = 0, size = 30): Observable<ApiPage<AlertResponse>> {
    const params = this.createPageParams(page, size);
    return this.http.get<ApiPage<AlertResponse>>(this.base, { params });
  }

  getAlertById(id: number): Observable<AlertResponse> {
    return this.http.get<AlertResponse>(`${this.base}/${id}`);
  }

  getMyAlerts(page = 0, size = 30): Observable<ApiPage<AlertResponse>> {
    const params = this.createPageParams(page, size);
    return this.http.get<ApiPage<AlertResponse>>(`${this.base}/user/my-alerts`, { params });
  }

  createAlert(payload: CreateAlertRequest): Observable<AlertResponse> {
    return this.http.post<AlertResponse>(this.base, payload);
  }

  updateAlert(alertId: number, payload: UpdateAlertRequest): Observable<AlertResponse> {
    return this.http.put<AlertResponse>(`${this.base}/${alertId}`, payload);
  }

  deleteAlert(alertId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${alertId}`);
  }

  addImage(alertId: number, payload: AddMediaRequest): Observable<AlertResponse> {
    return this.http.post<AlertResponse>(`${this.base}/${alertId}/images`, payload);
  }

  addVideo(alertId: number, payload: AddMediaRequest): Observable<AlertResponse> {
    return this.http.post<AlertResponse>(`${this.base}/${alertId}/videos`, payload);
  }

  removeImage(alertId: number, imageUrl: string): Observable<AlertResponse> {
    const params = new HttpParams().set('imageUrl', imageUrl);
    return this.http.delete<AlertResponse>(`${this.base}/${alertId}/images`, { params });
  }

  removeVideo(alertId: number, videoUrl: string): Observable<AlertResponse> {
    const params = new HttpParams().set('videoUrl', videoUrl);
    return this.http.delete<AlertResponse>(`${this.base}/${alertId}/videos`, { params });
  }

  getUnqualifiedAlerts(page = 0, size = 10): Observable<ApiPage<AlertResponse>> {
    const params = this.createPageParams(page, size);
    return this.http.get<ApiPage<AlertResponse>>(`${this.base}/unqualified`, { params });
  }

  getSimilarAlerts(alertId: number, radiusMeters = 300): Observable<AlertResponse[]> {
    const params = new HttpParams().set('radius', String(radiusMeters));
    return this.http.get<AlertResponse[]>(`${this.base}/${alertId}/similar`, { params });
  }

  private createPageParams(page: number, size: number): HttpParams {
    return new HttpParams().set('page', String(page)).set('size', String(size));
  }
}
