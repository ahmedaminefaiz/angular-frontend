import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProblemKpi } from '../../../../models/kpi.models';

@Component({
  selector: 'app-kpi-problem-section',
  standalone: true,
  imports: [],
  host: { class: 'block h-full' },
  templateUrl: './kpi-problem-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiProblemSectionComponent {
  @Input({ required: true }) data!: ProblemKpi;
  @Input() loading = false;

  get resolutionRate(): number {
    if (!this.data?.total) return 0;
    return Math.round((this.data.resolus / this.data.total) * 100);
  }

  formatHours(h: number | null): string {
    if (h == null) return '—';
    if (h < 1) return `${Math.round(h * 60)}min`;
    if (h >= 24) return `${(h / 24).toFixed(1)}j`;
    return `${h.toFixed(1)}h`;
  }
}