import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProblemsService } from '../../../../services/problems.service';
import { ProblemResponse } from '../../../../models/problem.models';
import { InterventionListComponent } from '../intervention-list/intervention-list.component';

@Component({
  selector: 'app-problem-detail',
  standalone: true,
  imports: [CommonModule, InterventionListComponent],
  templateUrl: './problem-detail.component.html'
})
export class ProblemDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly problemsService = inject(ProblemsService);
  private readonly subscriptions = new Subscription();

  @ViewChild(InterventionListComponent) interventionList?: InterventionListComponent;

  readonly problem = signal<ProblemResponse | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const sub = this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (id) {
        this.loadProblem(id);
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadProblem(id: number): void {
    this.loading.set(true);
    const sub = this.problemsService.getProblemById(id).subscribe({
      next: (problem) => {
        this.problem.set(problem);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/agent']);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      NEW: 'Nouveau',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu',
      REJECTED: 'Rejeté'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      NEW: 'chip-info',
      IN_PROGRESS: 'chip-amber',
      RESOLVED: 'chip-ok',
      REJECTED: 'chip-crit'
    };
    return classes[status] || 'chip-neutral';
  }
}
