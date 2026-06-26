import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { InterventionService } from '../../../services/intervention.service';
import { InterventionResponse, InterventionStatus, INTERVENTION_STATUS_LABELS, INTERVENTION_ACTION_TYPE_LABELS } from '../../../models/intervention.models';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './agent-dashboard.component.html'
})
export class AgentDashboardComponent implements OnInit {
  private readonly interventionService = inject(InterventionService);

  readonly loading = signal(true);
  readonly recentInterventions = signal<InterventionResponse[]>([]);
  readonly totalCount = signal(0);
  readonly affecteeCount = signal(0);
  readonly enCoursCount = signal(0);
  readonly resolueCount = signal(0);

  readonly statusLabels = INTERVENTION_STATUS_LABELS;
  readonly actionTypeLabels = INTERVENTION_ACTION_TYPE_LABELS;

  ngOnInit() {
    this.interventionService.getMyInterventions(0, 100).subscribe({
      next: (page) => {
        const items = page.content;
        this.totalCount.set(page.totalElements);
        this.affecteeCount.set(items.filter(i => i.status === 'AFFECTEE').length);
        this.enCoursCount.set(items.filter(i => i.status === 'EN_COURS').length);
        this.resolueCount.set(items.filter(i => i.status === 'RESOLUE' || i.status === 'PARTIELLEMENT_RESOLUE').length);
        this.recentInterventions.set(items.slice(0, 3));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statusClass(status: InterventionStatus): string {
    const map: Record<InterventionStatus, string> = {
      AFFECTEE: 'chip-info',
      EN_COURS: 'chip-amber',
      SUSPENDUE: 'chip-amber',
      EN_ATTENTE_AUTRE_EQUIPE: 'chip-neutral',
      RESOLUE: 'chip-ok',
      PARTIELLEMENT_RESOLUE: 'chip-ok',
      ECHEC_INTERVENTION: 'chip-crit',
      CLOTUREE: 'chip-neutral'
    };
    return map[status] ?? 'chip-neutral';
  }
}
