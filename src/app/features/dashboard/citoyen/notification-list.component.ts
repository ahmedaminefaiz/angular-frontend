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
import { AlertsService } from '../../../services/alerts.service';
import { ProblemsService } from '../../../services/problems.service';
import { TokenService } from '../../../core/services/token.service';
import { NotificationResponse } from '../../../models/notification.models';
import { AlertResponse } from '../../../models/alert.models';
import { ProblemResponse } from '../../../models/problem.models';
import { AlertDetailModalComponent } from './alert-detail-modal.component';
import { ProblemDetailModalComponent } from './problem-detail-modal.component';

const ALERT_TYPES = new Set(['ALERT_RECEIVED', 'ALERT_STATUS_CHANGE']);

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [DatePipe, AlertDetailModalComponent, ProblemDetailModalComponent],
  templateUrl: './notification-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationListComponent implements OnInit {
  private readonly notifService = inject(NotificationService);
  private readonly alertsService = inject(AlertsService);
  private readonly problemsService = inject(ProblemsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUserId = inject(TokenService).getUserId();

  readonly notifications = signal<NotificationResponse[]>([]);
  readonly loading = signal(false);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 20;

  readonly selectedAlert = signal<AlertResponse | null>(null);
  readonly selectedProblem = signal<ProblemResponse | null>(null);
  readonly detailLoading = signal(false);

  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.isRead).length
  );

  readonly canManageAlert = computed(() => {
    const alert = this.selectedAlert();
    if (!alert) return false;
    return alert.user.id === this.currentUserId && alert.status === 'NEW';
  });

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

  openDetail(notif: NotificationResponse): void {
    if (!notif.isRead) this.markAsRead(notif);
    if (!notif.referenceId) return;

    this.detailLoading.set(true);

    if (ALERT_TYPES.has(notif.type)) {
      this.alertsService.getAlertById(notif.referenceId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (alert) => { this.selectedAlert.set(alert); this.detailLoading.set(false); },
          error: () => this.detailLoading.set(false)
        });
    } else {
      this.problemsService.getProblemById(notif.referenceId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (problem) => { this.selectedProblem.set(problem); this.detailLoading.set(false); },
          error: () => this.detailLoading.set(false)
        });
    }
  }

  closeDetail(): void {
    this.selectedAlert.set(null);
    this.selectedProblem.set(null);
  }

  onRemoveImage(imageUrl: string): void {
    const alert = this.selectedAlert();
    if (!alert) return;
    this.alertsService.removeImage(alert.id, imageUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (updated) => this.selectedAlert.set(updated) });
  }

  onRemoveVideo(videoUrl: string): void {
    const alert = this.selectedAlert();
    if (!alert) return;
    this.alertsService.removeVideo(alert.id, videoUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (updated) => this.selectedAlert.set(updated) });
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
