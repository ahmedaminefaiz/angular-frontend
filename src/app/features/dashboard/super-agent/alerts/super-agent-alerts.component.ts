import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { AlertResponse, ApiPage } from '../../../../models/alert.models';
import { ProblemResponse } from '../../../../models/problem.models';
import { UserSummaryResponse } from '../../../../models/user-management.models';
import { AlertsService } from '../../../../services/alerts.service';
import { UserManagementService } from '../../../../services/user-management.service';
import { SimilarAlertsPanelComponent } from './similar-alerts-panel.component';
import { QualifyFormComponent } from './qualify-form.component';

@Component({
  selector: 'app-super-agent-alerts',
  standalone: true,
  imports: [FormsModule, SlicePipe, SimilarAlertsPanelComponent, QualifyFormComponent],
  templateUrl: './super-agent-alerts.component.html'
})
export class SuperAgentAlertsComponent implements OnInit {
  readonly alertsPage = signal<ApiPage<AlertResponse>>({
    content: [], totalElements: 0, totalPages: 0, size: 10, number: 0
  });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly successMessage = signal('');

  readonly selectedMap = signal<Map<number, AlertResponse>>(new Map());
  readonly expandedSimilarId = signal<number | null>(null);
  readonly showQualifyForm = signal(false);
  readonly agents = signal<UserSummaryResponse[]>([]);

  searchTerm = '';
  currentPage = 0;

  constructor(
    private readonly alertsService: AlertsService,
    private readonly userManagementService: UserManagementService
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.userManagementService.getActiveAgents().subscribe({
      next: (list) => this.agents.set(list),
      error: () => {}
    });
  }

  loadAlerts(page = 0): void {
    this.loading.set(true);
    this.error.set('');
    this.currentPage = page;
    this.alertsService.getUnqualifiedAlerts(page).subscribe({
      next: (data) => {
        this.alertsPage.set(data);
        this.selectedMap.set(new Map());
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les signalements.');
        this.loading.set(false);
      }
    });
  }

  get filteredAlerts(): AlertResponse[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.alertsPage().content;
    return this.alertsPage().content.filter(a =>
      a.title.toLowerCase().includes(term) ||
      (a.address ?? '').toLowerCase().includes(term) ||
      a.category.name.toLowerCase().includes(term)
    );
  }

  toggleSelect(id: number): void {
    this.selectedMap.update(map => {
      const next = new Map(map);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const alert = this.alertsPage().content.find(a => a.id === id);
        if (alert) next.set(id, alert);
      }
      return next;
    });
  }

  selectAll(): void {
    this.selectedMap.set(new Map(this.filteredAlerts.map(a => [a.id, a])));
  }

  clearSelection(): void {
    this.selectedMap.set(new Map());
  }

  toggleSimilar(alertId: number): void {
    this.expandedSimilarId.update(cur => cur === alertId ? null : alertId);
  }

  includeSimilarAlert(alert: AlertResponse): void {
    this.selectedMap.update(map => {
      const next = new Map(map);
      next.set(alert.id, alert);
      return next;
    });
  }

  get selectedAlerts(): AlertResponse[] {
    return Array.from(this.selectedMap().values());
  }

  openQualifyForm(): void {
    this.showQualifyForm.set(true);
  }

  onQualifySubmitted(problem: ProblemResponse): void {
    this.showQualifyForm.set(false);
    this.flash(`Problème #${problem.id} créé avec succès.`);
    this.loadAlerts(this.currentPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: this.alertsPage().totalPages }, (_, i) => i);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      NEW: 'Nouveau', IN_PROGRESS: 'En cours', RESOLVED: 'Résolu', REJECTED: 'Clôturé'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      NEW: 'chip-info',
      IN_PROGRESS: 'chip-amber',
      RESOLVED: 'chip-ok',
      REJECTED: 'chip-crit'
    };
    return map[status] ?? 'chip-neutral';
  }

  priorityClass(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'chip-ok',
      MEDIUM: 'chip-info',
      HIGH: 'chip-amber',
      CRITICAL: 'chip-crit'
    };
    return map[priority] ?? 'chip-neutral';
  }

  private flash(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }
}
