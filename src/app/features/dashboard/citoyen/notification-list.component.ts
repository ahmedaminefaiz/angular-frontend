import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../../services/notification.service';
import { NotificationResponse } from '../../../models/notification.models';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationListComponent implements OnInit {
  private readonly notifService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications = signal<NotificationResponse[]>([]);
  readonly loading = signal(false);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 20;

  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.isRead).length
  );

  ngOnInit(): void {
    this.loadPage(0);

    this.notifService.live$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(notif => {
        this.notifications.update(list => [notif, ...list]);
        this.totalElements.update(n => n + 1);
      });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.notifService.getNotifications(page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.notifications.set(resp.content);
          this.totalPages.set(resp.totalPages);
          this.totalElements.set(resp.totalElements);
          this.currentPage.set(resp.number);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  markAsRead(notif: NotificationResponse): void {
    if (notif.isRead) return;
    this.notifService.markAsRead(notif.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.notifications.update(list =>
            list.map(n => n.id === updated.id ? updated : n)
          );
          this.notifService.decrementUnread();
        }
      });
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
          this.notifService.resetUnread();
        }
      });
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.loadPage(page);
  }
}