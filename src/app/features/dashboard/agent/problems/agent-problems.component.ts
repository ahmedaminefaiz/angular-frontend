import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { ApiPage } from '../../../../models/alert.models';
import { ProblemResponse, ProblemStatus } from '../../../../models/problem.models';
import { ProblemsService } from '../../../../services/problems.service';

@Component({
  selector: 'app-agent-problems',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  templateUrl: './agent-problems.component.html'
})
export class AgentProblemsComponent implements OnInit {
  readonly problemsPage = signal<ApiPage<ProblemResponse>>({
    content: [], totalElements: 0, totalPages: 0, size: 10, number: 0
  });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly expandedId = signal<number | null>(null);

  statusFilter: ProblemStatus | '' = '';
  currentPage = 0;

  readonly allStatuses: { value: ProblemStatus | ''; label: string }[] = [
    { value: '', label: 'Tous les statuts' },
    { value: 'NEW', label: 'Nouveau' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'RESOLVED', label: 'Résolu' },
    { value: 'REJECTED', label: 'Clôturé' }
  ];

  constructor(private readonly problemsService: ProblemsService) {}

  ngOnInit(): void {
    this.loadProblems();
  }

  loadProblems(page = 0): void {
    this.loading.set(true);
    this.error.set('');
    this.currentPage = page;
    this.problemsService.getProblems(page).subscribe({
      next: (data) => {
        this.problemsPage.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les problèmes assignés.');
        this.loading.set(false);
      }
    });
  }

  get filteredProblems(): ProblemResponse[] {
    if (!this.statusFilter) return this.problemsPage().content;
    return this.problemsPage().content.filter(p => p.status === this.statusFilter);
  }

  toggleExpand(id: number): void {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  changeStatus(problem: ProblemResponse, newStatus: ProblemStatus): void {
    this.error.set('');
    this.problemsService.changeStatus(problem.id, { newStatus }).subscribe({
      next: (updated) => {
        this.problemsPage.update(page => ({
          ...page,
          content: page.content.map(p => p.id === updated.id ? updated : p)
        }));
        this.flash(`Statut changé en "${this.statusLabel(newStatus)}".`);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Impossible de changer le statut.');
      }
    });
  }

  get totalPages(): number[] {
    return Array.from({ length: this.problemsPage().totalPages }, (_, i) => i);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      NEW: 'Nouveau', IN_PROGRESS: 'En cours', RESOLVED: 'Résolu', REJECTED: 'Clôturé'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
  }

  nextStatuses(current: ProblemStatus): { value: ProblemStatus; label: string }[] {
    const transitions: Record<ProblemStatus, ProblemStatus[]> = {
      NEW: ['IN_PROGRESS'],
      IN_PROGRESS: ['RESOLVED', 'REJECTED'],
      RESOLVED: [],
      REJECTED: []
    };
    return (transitions[current] ?? []).map(s => ({ value: s, label: this.statusLabel(s) }));
  }

  private flash(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }
}
