import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProblemsService } from '../../../services/problems.service';
import { ProblemDetailModalComponent } from './problem-detail-modal.component';
import { ProblemResponse, ProblemStatus } from '../../../models/problem.models';
import { ApiPage } from '../../../models/alert.models';

@Component({
  selector: 'app-approved-alerts',
  standalone: true,
  imports: [DatePipe, ProblemDetailModalComponent],
  templateUrl: './approved-alerts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovedAlertsComponent implements OnInit {
  private readonly problemsService = inject(ProblemsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly page = signal<ApiPage<ProblemResponse>>({
    content: [], totalElements: 0, totalPages: 0, size: 9, number: 0
  });
  readonly loading = signal(true);
  readonly selectedProblem = signal<ProblemResponse | null>(null);

  readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(pageNum: number): void {
    this.loading.set(true);
    this.problemsService.getProblemsRelatedToMyAlerts(pageNum, 9)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.page.set(data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  changePage(next: number): void {
    if (next < 0 || next >= this.page().totalPages) return;
    this.loadPage(next);
  }

  openDetail(problem: ProblemResponse): void {
    this.selectedProblem.set(problem);
  }

  closeDetail(): void {
    this.selectedProblem.set(null);
  }

  criticalityLabel(problem: ProblemResponse): string {
    if (!problem.criticality) return '—';
    return `${problem.criticality.name} (${problem.criticality.delayHours}h)`;
  }

  statusLabel(status: ProblemStatus): string {
    const labels: Record<ProblemStatus, string> = {
      NEW: 'Nouveau',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu',
      REJECTED: 'Rejeté'
    };
    return labels[status] ?? status;
  }

  statusClass(status: ProblemStatus): string {
    const classes: Record<ProblemStatus, string> = {
      NEW: 'chip-info',
      IN_PROGRESS: 'chip-amber',
      RESOLVED: 'chip-ok',
      REJECTED: 'chip-crit'
    };
    return classes[status] ?? 'chip-neutral';
  }
}