import { Component, Input, OnChanges, Output, EventEmitter, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { AlertResponse, AlertSimilarityResponse } from '../../../../models/alert.models';
import { AlertsService } from '../../../../services/alerts.service';

@Component({
  selector: 'app-similar-alerts-panel',
  standalone: true,
  imports: [SlicePipe],
  template: `
    <div class="panel-2 mt-2 rounded-lg border border-line p-3">
      <p class="microlabel mb-2" style="color:var(--color-info)">
        Signalements similaires (même catégorie, &le;300m)
      </p>

      @if (loading()) {
        <div class="flex items-center gap-2 py-2">
          <svg class="h-4 w-4 animate-pulse text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.912 3.912 0 01-.802.777A3.97 3.97 0 0112 17a3.97 3.97 0 01-2.069-.573 3.912 3.912 0 01-.802-.777l-.346-.347z"/>
          </svg>
          <span class="text-sm text-info">Analyse IA en cours…</span>
        </div>
      } @else if (error()) {
        <p class="text-sm text-crit">{{ error() }}</p>
      } @else if (similar().length === 0) {
        <p class="text-sm italic text-faint">Aucun signalement similaire trouvé.</p>
      } @else {
        <ul class="space-y-2">
          @for (a of similar(); track a.id) {
            <li class="flex items-start justify-between gap-2 rounded-lg border border-line bg-surface p-2">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-ink"><span class="mono text-faint">#A-{{ a.id }}</span> — {{ a.title }}</p>
                <p class="text-xs text-muted">{{ a.address || 'Adresse non renseignée' }} · {{ a.category.name }}</p>
                <p class="mono text-[0.7rem] text-faint">{{ a.createdAt | slice:0:10 }}</p>
              </div>
              <span class="chip" [class.chip-ok]="a.score >= 0.9" [class.chip-signal]="a.score < 0.9">
                {{ (a.score * 100).toFixed(0) }}%
              </span>
              <button (click)="include.emit(a)" class="btn btn-signal btn-sm shrink-0">Inclure</button>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class SimilarAlertsPanelComponent implements OnChanges {
  @Input({ required: true }) alertId!: number;
  @Output() include = new EventEmitter<AlertSimilarityResponse>();

  readonly similar = signal<AlertSimilarityResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(private readonly alertsService: AlertsService) {}

  ngOnChanges(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.alertsService.getSimilarAlerts(this.alertId).subscribe({
      next: (results) => {
        this.similar.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les similarités.');
        this.loading.set(false);
      }
    });
  }
}
