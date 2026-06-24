import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CriticalityResponse } from '../models/problem.models';

@Injectable({ providedIn: 'root' })
export class CriticalityService {
  private readonly base = `${environment.apiUrl}/v1/criticalities`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<CriticalityResponse[]> {
    return this.http.get<CriticalityResponse[]>(this.base);
  }
}