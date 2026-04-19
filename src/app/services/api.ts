import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private apiUrl = 'http://ebd2-springbootappprod-0yzlxj-8fd11f-192-166-204-204.traefik.me/api'; // Your Spring Boot base URL

  constructor(private http: HttpClient) {}

  getHello(): Observable<string> {
    return this.http.get(this.apiUrl + '/hello', { responseType: 'text' });
  }
}
