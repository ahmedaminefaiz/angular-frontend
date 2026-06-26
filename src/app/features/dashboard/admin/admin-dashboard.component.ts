import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserManagementService } from '../../../services/user-management.service';
import { AlertsService } from '../../../services/alerts.service';
import { ProblemsService } from '../../../services/problems.service';
import { AlertResponse } from '../../../models/alert.models';
import { ProblemResponse } from '../../../models/problem.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  readonly pendingCount = signal(0);
  readonly loadingPending = signal(true);

  readonly recentAlerts = signal<AlertResponse[]>([]);
  readonly recentProblems = signal<ProblemResponse[]>([]);
  readonly loadingActivity = signal(true);

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly alertsService: AlertsService,
    private readonly problemsService: ProblemsService
  ) {}

  ngOnInit() {
    this.userManagementService.getPendingSuperAgents().subscribe({
      next: (superAgents) => {
        this.pendingCount.set(superAgents.length);
        this.loadingPending.set(false);
      },
      error: () => this.loadingPending.set(false)
    });

    let alertsDone = false;
    let problemsDone = false;
    const checkDone = () => {
      if (alertsDone && problemsDone) this.loadingActivity.set(false);
    };

    this.alertsService.getAlerts(0, 5).subscribe({
      next: (page) => {
        this.recentAlerts.set(page.content);
        alertsDone = true;
        checkDone();
      },
      error: () => { alertsDone = true; checkDone(); }
    });

    this.problemsService.getProblems(0, 5).subscribe({
      next: (page) => {
        this.recentProblems.set(page.content);
        problemsDone = true;
        checkDone();
      },
      error: () => { problemsDone = true; checkDone(); }
    });
  }

  priorityClass(priority: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'chip-crit',
      HIGH: 'chip-amber',
      MEDIUM: 'chip-info',
      LOW: 'chip-ok'
    };
    return map[priority] ?? 'chip-neutral';
  }

  priorityLabel(priority: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'Critique',
      HIGH: 'Haute',
      MEDIUM: 'Moyenne',
      LOW: 'Faible'
    };
    return map[priority] ?? priority;
  }

  problemStatusLabel(status: string): string {
    const map: Record<string, string> = {
      NEW: 'Nouveau',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu',
      REJECTED: 'Rejeté'
    };
    return map[status] ?? status;
  }

  problemStatusClass(status: string): string {
    const map: Record<string, string> = {
      NEW: 'chip-info',
      IN_PROGRESS: 'chip-amber',
      RESOLVED: 'chip-ok',
      REJECTED: 'chip-crit'
    };
    return map[status] ?? 'chip-neutral';
  }
}
