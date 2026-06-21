import { Component, Input, OnChanges, Output, EventEmitter, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { AlertResponse } from '../../../../models/alert.models';
import { AlertsService } from '../../../../services/alerts.service';

@Component({
  selector: 'app-similar-alerts-panel',
  standalone: true,
  imports: [SlicePipe],
  template: `
    <div class="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
        Signalements similaires (même catégorie, &le;300m)
      </p>

      @if (loading()) {
        <p class="text-sm text-blue-500">Chargement…</p>
      } @else if (error()) {
        <p class="text-sm text-red-500">{{ error() }}</p>
      } @else if (similar().length === 0) {
        <p class="text-sm text-gray-500 italic">Aucun signalement similaire trouvé.</p>
      } @else {
        <ul class="space-y-2">
          @for (a of similar(); track a.id) {
            <li class="flex items-start justify-between gap-2 rounded bg-white p-2 shadow-sm">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-800">#{{ a.id }} — {{ a.title }}</p>
                <p class="text-xs text-gray-500">{{ a.address || 'Adresse non renseignée' }} · {{ a.category.name }}</p>
                <p class="text-xs text-gray-400">{{ a.createdAt | slice:0:10 }}</p>
              </div>
              <button
                (click)="include.emit(a)"
                class="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                Inclure
              </button>
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
