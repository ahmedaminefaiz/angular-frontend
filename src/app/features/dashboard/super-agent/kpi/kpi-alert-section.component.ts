import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AlertKpi } from '../../../../models/kpi.models';

@Component({
  selector: 'app-kpi-alert-section',
  standalone: true,
  imports: [],
  templateUrl: './kpi-alert-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiAlertSectionComponent {
  @Input({ required: true }) data!: AlertKpi;
  @Input() loading = false;

  get qualificationRate(): number {
    if (!this.data?.total) return 0;
    return Math.round((this.data.qualifiees / this.data.total) * 100);
  }

  formatHours(h: number | null): string {
    if (h == null) return '—';
    if (h < 1) return `${Math.round(h * 60)}min`;
    return `${h.toFixed(1)}h`;
  }
}