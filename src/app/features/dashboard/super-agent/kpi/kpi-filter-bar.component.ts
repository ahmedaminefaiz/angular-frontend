import {
  ChangeDetectionStrategy, Component, EventEmitter,
  Input, Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KpiFilters } from '../../../../models/kpi.models';
import { UserSummaryResponse } from '../../../../models/user-management.models';

const PERIODS: { label: string; value: number | null }[] = [
  { label: 'Tout', value: null },
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '90 jours', value: 90 },
];

@Component({
  selector: 'app-kpi-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './kpi-filter-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiFilterBarComponent {
  @Input() agents: UserSummaryResponse[] = [];
  @Input() loading = false;
  @Input() lastRefresh: Date | null = null;
  @Output() filtersChange = new EventEmitter<KpiFilters>();
  @Output() refreshClick = new EventEmitter<void>();

  readonly periods = PERIODS;
  selectedPeriod: number | null = 30;
  selectedAgentId: number | null = null;

  selectPeriod(value: number | null): void {
    this.selectedPeriod = value;
    this.emit();
  }

  onAgentChange(): void {
    this.emit();
  }

  get lastRefreshLabel(): string {
    if (!this.lastRefresh) return '';
    const secs = Math.floor((Date.now() - this.lastRefresh.getTime()) / 1000);
    if (secs < 60) return `Actualisé il y a ${secs}s`;
    return `Actualisé il y a ${Math.floor(secs / 60)}min`;
  }

  private emit(): void {
    this.filtersChange.emit({
      periodDays: this.selectedPeriod,
      agentId: this.selectedAgentId ? Number(this.selectedAgentId) : null
    });
  }
}