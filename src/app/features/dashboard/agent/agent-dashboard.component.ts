import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ProblemsService } from '../../../services/problems.service';
import { ProblemResponse, ProblemStatus } from '../../../models/problem.models';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './agent-dashboard.component.html'
})
export class AgentDashboardComponent implements OnInit {
  readonly loading = signal(true);
  readonly recentProblems = signal<ProblemResponse[]>([]);
  readonly totalCount = signal(0);
  readonly newCount = signal(0);
  readonly inProgressCount = signal(0);
  readonly resolvedCount = signal(0);

  constructor(private readonly problemsService: ProblemsService) {}

  ngOnInit() {
    this.problemsService.getAssignedProblems(0, 100).subscribe({
      next: (page) => {
        const items = page.content;
        this.totalCount.set(page.totalElements);
        this.newCount.set(items.filter(p => p.status === 'NEW').length);
        this.inProgressCount.set(items.filter(p => p.status === 'IN_PROGRESS').length);
        this.resolvedCount.set(items.filter(p => p.status === 'RESOLVED').length);
        this.recentProblems.set(items.slice(0, 3));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statusLabel(status: ProblemStatus): string {
    const map: Record<ProblemStatus, string> = {
      NEW: 'Nouveau',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu',
      REJECTED: 'Rejeté'
    };
    return map[status] ?? status;
  }

  statusClass(status: ProblemStatus): string {
    const map: Record<ProblemStatus, string> = {
      NEW: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
      RESOLVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}
