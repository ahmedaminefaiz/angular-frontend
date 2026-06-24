import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../environments/environment';
import { NotificationResponse } from '../models/notification.models';
import { ApiPage } from '../models/alert.models';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly base = `${environment.apiUrl}/v1/notifications`;
  private readonly wsUrl = environment.apiUrl.replace('/api', '') + '/ws';

  private stompClient: Client | null = null;
  private countSub: Subscription | null = null;

  private readonly _unreadCount = new BehaviorSubject<number>(0);
  private readonly _live = new Subject<NotificationResponse>();

  readonly unreadCount$ = this._unreadCount.asObservable();
  readonly live$ = this._live.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly ngZone: NgZone
  ) {}

  initForUser(): void {
    this.countSub?.unsubscribe();
    this.countSub = this.getUnreadCount().subscribe({
      next: (res) => this._unreadCount.next(res.count),
      error: () => {}
    });
  }

  connect(token: string): void {
    if (this.stompClient?.active) return;

    const wsUrl = this.wsUrl;

    this.stompClient = new Client({
      webSocketFactory: () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
        const SockJS = require('sockjs-client') as new (url: string) => any;
        return new SockJS(wsUrl);
      },
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        this.stompClient?.subscribe('/user/queue/notifications', (msg: IMessage) => {
          this.ngZone.run(() => {
            const notif: NotificationResponse = JSON.parse(msg.body) as NotificationResponse;
            this._live.next(notif);
            this._unreadCount.next(this._unreadCount.value + 1);
          });
        });
      },
      reconnectDelay: 5000,
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    this.stompClient?.deactivate();
    this.stompClient = null;
    this.countSub?.unsubscribe();
    this.countSub = null;
  }

  getNotifications(page = 0, size = 20): Observable<ApiPage<NotificationResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiPage<NotificationResponse>>(this.base, { params });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/unread-count`);
  }

  markAsRead(id: number): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.base}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.base}/read-all`, {});
  }

  setUnreadCount(n: number): void {
    this._unreadCount.next(n);
  }

  decrementUnread(): void {
    this._unreadCount.next(Math.max(0, this._unreadCount.value - 1));
  }

  resetUnread(): void {
    this._unreadCount.next(0);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}