import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InterventionKpi } from '../../../../models/kpi.models';

interface StatutMeta {
  label: string;
  bg: string;
  text: string;
  bar: string;
}

const STATUT_META: Record<string, StatutMeta> = {
  AFFECTEE:                  { label: 'Affectée',             bg: 'bg-violet-100', text: 'text-violet-700', bar: 'bg-violet-500' },
  EN_COURS:                  { label: 'En cours',             bg: 'bg-blue-100',   text: 'text-blue-700',   bar: 'bg-blue-500'   },
  SUSPENDUE:                 { label: 'Suspendue',            bg: 'bg-amber-100',  text: 'text-amber-700',  bar: 'bg-amber-500'  },
  EN_ATTENTE_AUTRE_EQUIPE:   { label: 'En attente équipe',   bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
  PARTIELLEMENT_RESOLUE:     { label: 'Partiellement rés.',  bg: 'bg-teal-100',   text: 'text-teal-700',   bar: 'bg-teal-500'   },
  RESOLUE:                   { label: 'Résolue',              bg: 'bg-emerald-100',text: 'text-emerald-700',bar: 'bg-emerald-500'},
  CLOTUREE:                  { label: 'Clôturée',             bg: 'bg-green-100',  text: 'text-green-700',  bar: 'bg-green-600'  },
  ECHEC_INTERVENTION:        { label: 'Échec',                bg: 'bg-rose-100',   text: 'text-rose-700',   bar: 'bg-rose-500'   },
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
        meta: STATUT_META[key] ?? { label: key, bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-400' },
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