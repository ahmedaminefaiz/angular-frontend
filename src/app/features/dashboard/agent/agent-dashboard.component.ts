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
      AFFECTEE: 'bg-blue-100 text-blue-700',
      EN_COURS: 'bg-yellow-100 text-yellow-700',
      SUSPENDUE: 'bg-orange-100 text-orange-700',
      EN_ATTENTE_AUTRE_EQUIPE: 'bg-purple-100 text-purple-700',
      RESOLUE: 'bg-green-100 text-green-700',
      PARTIELLEMENT_RESOLUE: 'bg-teal-100 text-teal-700',
      ECHEC_INTERVENTION: 'bg-red-100 text-red-700',
      CLOTUREE: 'bg-gray-200 text-gray-700'
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}
