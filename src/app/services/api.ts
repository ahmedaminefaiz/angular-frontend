import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private apiUrl = 'https://springboot-api-production-ebd2.up.railway.app/api/hello'; // Your Spring Boot base URL

  constructor(private http: HttpClient) {}

  getHello(): Observable<string> {
    return this.http.get(this.apiUrl + '/hello', { responseType: 'text' });
  }
}
