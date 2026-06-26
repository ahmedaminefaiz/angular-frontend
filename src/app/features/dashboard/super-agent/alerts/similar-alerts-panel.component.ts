import { Component, Input, OnChanges, Output, EventEmitter, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { AlertResponse } from '../../../../models/alert.models';
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
        <p class="text-sm text-info">Chargement…</p>
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
  @Output() include = new EventEmitter<AlertResponse>();

  readonly similar = signal<AlertResponse[]>([]);
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
