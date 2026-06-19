import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AlertResponse, ApiPage } from '../../../models/alert.models';

type AlertTab = 'alerts' | 'my-alerts';

@Component({
  selector: 'app-alert-table',
  standalone: true,
  imports: [],
  templateUrl: './alert-table.component.html'
})
export class AlertTableComponent {
  @Input() page: ApiPage<AlertResponse> = { content: [], totalElements: 0, totalPages: 0, size: 30, number: 0 };
  @Input() loading = false;
  @Input() currentUserId: number | null = null;
  @Input() tab: AlertTab = 'alerts';

  @Output() readonly view = new EventEmitter<AlertResponse>();
  @Output() readonly edit = new EventEmitter<AlertResponse>();
  @Output() readonly remove = new EventEmitter<number>();
  @Output() readonly addMedia = new EventEmitter<AlertResponse>();
  @Output() readonly pageChange = new EventEmitter<number>();

  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

  canManage(alert: AlertResponse): boolean {
    return alert.user.id === this.currentUserId && alert.status === 'NEW';
  }

  getRowToneClass(alert: AlertResponse): 'normal' | 'muted' | 'warning' | 'success' | 'danger' {
    if (this.tab === 'alerts') {
      return alert.user.id === this.currentUserId ? 'normal' : 'muted';
    }
    if (alert.status === 'IN_PROGRESS') return 'warning';
    if (alert.status === 'RESOLVED') return 'success';
    if (alert.status === 'REJECTED') return 'danger';
    return 'normal';
  }
}
