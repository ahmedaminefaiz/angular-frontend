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
      CRITICAL: 'bg-red-100 text-red-700',
      HIGH: 'bg-orange-100 text-orange-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-blue-100 text-blue-700'
    };
    return map[priority] ?? 'bg-gray-100 text-gray-600';
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
      NEW: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
      RESOLVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}
