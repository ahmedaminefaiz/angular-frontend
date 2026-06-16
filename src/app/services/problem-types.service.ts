import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ProblemTypeSummary } from '../models/alert.models';

@Injectable({ providedIn: 'root' })
export class ProblemTypesService {
  private readonly base = `${environment.apiUrl}/v1/problem-types`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ProblemTypeSummary[]> {
    return this.http.get<ProblemTypeSummary[]>(this.base).pipe(
      catchError(() => of([]))
    );
  }
}
