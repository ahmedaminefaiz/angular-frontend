import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserManagementService } from '../../../services/user-management.service';
import { ProblemsService } from '../../../services/problems.service';
import { UserSummaryResponse } from '../../../models/user-management.models';
import { ProblemResponse, ProblemStatus } from '../../../models/problem.models';

@Component({
  selector: 'app-super-agent-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './super-agent-dashboard.component.html'
})
export class SuperAgentDashboardComponent implements OnInit {
  readonly pendingCount = signal(0);
  readonly loadingPending = signal(true);

  readonly problemStats = signal({ total: 0, new: 0, inProgress: 0, resolved: 0 });
  readonly recentProblems = signal<ProblemResponse[]>([]);
  readonly loadingProblems = signal(true);

  readonly myAgents = signal<UserSummaryResponse[]>([]);
  readonly loadingAgents = signal(true);

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly problemsService: ProblemsService
  ) {}

  ngOnInit() {
    this.userManagementService.getPendingAgents().subscribe({
      next: (agents) => {
        this.pendingCount.set(agents.length);
        this.loadingPending.set(false);
      },
      error: () => this.loadingPending.set(false)
    });

    this.problemsService.getMyProblems(0, 100).subscribe({
      next: (page) => {
        const items = page.content;
        this.problemStats.set({
          total: page.totalElements,
          new: items.filter(p => p.status === 'NEW').length,
          inProgress: items.filter(p => p.status === 'IN_PROGRESS').length,
          resolved: items.filter(p => p.status === 'RESOLVED').length
        });
        this.recentProblems.set(items.slice(0, 3));
        this.loadingProblems.set(false);
      },
      error: () => this.loadingProblems.set(false)
    });

    this.userManagementService.getMyAgents().subscribe({
      next: (agents) => {
        this.myAgents.set(agents);
        this.loadingAgents.set(false);
      },
      error: () => this.loadingAgents.set(false)
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
      NEW: 'chip-info',
      IN_PROGRESS: 'chip-amber',
      RESOLVED: 'chip-ok',
      REJECTED: 'chip-crit'
    };
    return map[status] ?? 'chip-neutral';
  }
}
