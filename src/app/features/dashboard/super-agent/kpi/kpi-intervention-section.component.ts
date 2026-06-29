import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InterventionKpi } from '../../../../models/kpi.models';

interface StatutMeta {
  label: string;
  bar: string;
}

const STATUT_META: Record<string, StatutMeta> = {
  AFFECTEE:                  { label: 'Affectée',            bar: 'bg-info'   },
  EN_COURS:                  { label: 'En cours',            bar: 'bg-signal' },
  SUSPENDUE:                 { label: 'Suspendue',           bar: 'bg-amber'  },
  EN_ATTENTE_AUTRE_EQUIPE:   { label: 'En attente équipe',   bar: 'bg-violet' },
  PARTIELLEMENT_RESOLUE:     { label: 'Partiellement rés.',  bar: 'bg-ok'     },
  RESOLUE:                   { label: 'Résolue',             bar: 'bg-ok'     },
  CLOTUREE:                  { label: 'Clôturée',            bar: 'bg-faint'  },
  ECHEC_INTERVENTION:        { label: 'Échec',               bar: 'bg-crit'   },
};

@Component({
  selector: 'app-kpi-intervention-section',
  standalone: true,
  imports: [],
  templateUrl: './kpi-intervention-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiInterventionSectionComponent {
  @Input({ required: true }) data!: InterventionKpi;
  @Input() loading = false;

  readonly statutMeta = STATUT_META;

  get statutEntries(): { key: string; count: number; meta: StatutMeta; pct: number }[] {
    const entries = Object.entries(this.data.parStatut ?? {})
      .map(([key, count]) => ({
        key,
        count,
        meta: STATUT_META[key] ?? { label: key, bar: 'bg-faint' },
        pct: this.data.total ? Math.round((count / this.data.total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
    return entries;
  }

  gaugeDasharray(percent: number | null): string {
    const p = Math.min(Math.max(percent ?? 0, 0), 100);
    return `${p} ${100 - p}`;
  }

  formatMinutes(m: number | null): string {
    if (m == null) return '—';
    if (m < 60) return `${Math.round(m)}min`;
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return min > 0 ? `${h}h${min}min` : `${h}h`;
  }
}