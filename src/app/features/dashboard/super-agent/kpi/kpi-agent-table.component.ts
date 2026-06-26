import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AgentPerformance } from '../../../../models/kpi.models';

@Component({
  selector: 'app-kpi-agent-table',
  standalone: true,
  imports: [],
  templateUrl: './kpi-agent-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiAgentTableComponent {
  @Input({ required: true }) agents: AgentPerformance[] = [];
  @Input() loading = false;

  get sorted(): AgentPerformance[] {
    return [...this.agents].sort((a, b) => this.successRate(b) - this.successRate(a));
  }

  successRate(a: AgentPerformance): number {
    if (!a.total) return 0;
    return Math.round((a.reussies / a.total) * 100);
  }

  initials(a: AgentPerformance): string {
    return `${a.prenom[0] ?? ''}${a.nom[0] ?? ''}`.toUpperCase();
  }

  avatarColor(index: number): string {
    const colors = [
      'bg-violet-500', 'bg-blue-500', 'bg-teal-500',
      'bg-indigo-500', 'bg-rose-500', 'bg-amber-500'
    ];
    return colors[index % colors.length];
  }
}