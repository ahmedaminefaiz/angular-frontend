import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { ApiPage } from '../../../../models/alert.models';
import { ProblemResponse, ProblemStatus } from '../../../../models/problem.models';
import { UserSummaryResponse } from '../../../../models/user-management.models';
import {
  InterventionResponse,
  InterventionStatus,
  InterventionUpdateResponse,
  INTERVENTION_STATUS_LABELS,
  INTERVENTION_ACTION_TYPE_LABELS
} from '../../../../models/intervention.models';
import { ProblemsService } from '../../../../services/problems.service';
import { UserManagementService } from '../../../../services/user-management.service';
import { InterventionService } from '../../../../services/intervention.service';
import { EditProblemFormComponent } from './edit-problem-form.component';
import { InterventionCreateFormComponent } from './intervention-create-form.component';

@Component({
  selector: 'app-super-agent-problems',
  standalone: true,
  imports: [FormsModule, SlicePipe, EditProblemFormComponent, InterventionCreateFormComponent],
  templateUrl: './super-agent-problems.component.html'
})
export class SuperAgentProblemsComponent implements OnInit {
  private readonly interventionService = inject(InterventionService);

  readonly problemsPage = signal<ApiPage<ProblemResponse>>({
    content: [], totalElements: 0, totalPages: 0, size: 10, number: 0
  });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly successMessage = signal('');

  readonly editingProblem = signal<ProblemResponse | null>(null);
  readonly expandedId = signal<number | null>(null);
  readonly agents = signal<UserSummaryResponse[]>([]);

  readonly showInterventionFormForProblem = signal<number | null>(null);
  readonly problemInterventions = signal<Map<number, InterventionResponse[]>>(new Map());
  readonly loadingInterventions = signal<number | null>(null);
  readonly closingInterventionId = signal<number | null>(null);

  readonly showHistoryForIntervention = signal<number | null>(null);
  readonly interventionHistory = signal<InterventionUpdateResponse[]>([]);
  readonly loadingHistory = signal(false);

  readonly interventionStatusLabels = INTERVENTION_STATUS_LABELS;
  readonly interventionActionTypeLabels = INTERVENTION_ACTION_TYPE_LABELS;

  statusFilter: ProblemStatus | '' = '';
  currentPage = 0;

  readonly allStatuses: { value: ProblemStatus | ''; label: string }[] = [
    { value: '', label: 'Tous les statuts' },
    { value: 'NEW', label: 'Nouveau' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'RESOLVED', label: 'Résolu' },
    { value: 'REJECTED', label: 'Clôturé' }
  ];

  constructor(
    private readonly problemsService: ProblemsService,
    private readonly userManagementService: UserManagementService
  ) {}

  ngOnInit(): void {
    this.loadProblems();
    this.userManagementService.getActiveAgents().subscribe({
      next: (list) => this.agents.set(list),
      error: () => {}
    });
  }

  loadProblems(page = 0): void {
    this.loading.set(true);
    this.error.set('');
    this.currentPage = page;
    this.problemsService.getMyProblems(page).subscribe({
      next: (data) => {
        this.problemsPage.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les problèmes.');
        this.loading.set(false);
      }
    });
  }

  get filteredProblems(): ProblemResponse[] {
    if (!this.statusFilter) return this.problemsPage().content;
    return this.problemsPage().content.filter(p => p.status === this.statusFilter);
  }

  toggleExpand(id: number): void {
    const wasExpanded = this.expandedId() === id;
    this.expandedId.update(cur => cur === id ? null : id);
    if (!wasExpanded) {
      this.loadInterventions(id);
    }
  }

  loadInterventions(problemId: number): void {
    this.loadingInterventions.set(problemId);
    this.interventionService.getByProblem(problemId, 0, 50).subscribe({
      next: (page) => {
        this.problemInterventions.update(map => {
          const updated = new Map(map);
          updated.set(problemId, page.content);
          return updated;
        });
        this.loadingInterventions.set(null);
      },
      error: () => {
        this.loadingInterventions.set(null);
      }
    });
  }

  openEdit(problem: ProblemResponse): void {
    this.editingProblem.set(problem);
  }

  onEditSubmitted(updated: ProblemResponse): void {
    this.editingProblem.set(null);
    this.problemsPage.update(page => ({
      ...page,
      content: page.content.map(p => p.id === updated.id ? updated : p)
    }));
    this.flash('Problème mis à jour avec succès.');
  }

  openInterventionForm(problemId: number): void {
    this.showInterventionFormForProblem.set(problemId);
  }

  onInterventionCreated(): void {
    const problemId = this.showInterventionFormForProblem();
    this.showInterventionFormForProblem.set(null);
    this.flash('Intervention créée avec succès.');
    if (problemId !== null) {
      this.loadInterventions(problemId);
    }
  }

  closeIntervention(interventionId: number, problemId: number): void {
    this.closingInterventionId.set(interventionId);
    this.interventionService.close(interventionId).subscribe({
      next: () => {
        this.closingInterventionId.set(null);
        this.loadInterventions(problemId);
        this.flash('Intervention clôturée.');
      },
      error: (err) => {
        this.closingInterventionId.set(null);
        this.error.set(err?.error?.message ?? 'Impossible de clôturer l\'intervention.');
      }
    });
  }

  deleteProblem(problem: ProblemResponse): void {
    if (!confirm(`Supprimer le problème #${problem.id} ? Cette action est irréversible.`)) return;
    this.problemsService.deleteProblem(problem.id).subscribe({
      next: () => {
        this.problemsPage.update(page => ({
          ...page,
          content: page.content.filter(p => p.id !== problem.id),
          totalElements: page.totalElements - 1
        }));
        this.flash('Problème supprimé.');
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Impossible de supprimer ce problème.')
    });
  }

  changeStatus(problem: ProblemResponse, newStatus: ProblemStatus): void {
    this.problemsService.changeStatus(problem.id, { newStatus }).subscribe({
      next: (updated) => {
        this.problemsPage.update(page => ({
          ...page,
          content: page.content.map(p => p.id === updated.id ? updated : p)
        }));
        this.flash(`Statut changé en "${this.statusLabel(newStatus)}".`);
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Impossible de changer le statut.')
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
      NEW: 'chip-info',
      IN_PROGRESS: 'chip-amber',
      RESOLVED: 'chip-ok',
      REJECTED: 'chip-crit'
    };
    return map[status] ?? 'chip-neutral';
  }

  getInterventionStatusClass(status: InterventionStatus): string {
    const classes: Record<InterventionStatus, string> = {
      AFFECTEE: 'chip-info',
      EN_COURS: 'chip-amber',
      SUSPENDUE: 'chip-amber',
      EN_ATTENTE_AUTRE_EQUIPE: 'chip-neutral',
      RESOLUE: 'chip-ok',
      PARTIELLEMENT_RESOLUE: 'chip-ok',
      ECHEC_INTERVENTION: 'chip-crit',
      CLOTUREE: 'chip-neutral'
    };
    return classes[status] || 'chip-neutral';
  }

  nextStatuses(current: ProblemStatus): { value: ProblemStatus; label: string }[] {
    const transitions: Record<ProblemStatus, ProblemStatus[]> = {
      NEW: ['IN_PROGRESS', 'REJECTED'],
      IN_PROGRESS: ['RESOLVED', 'REJECTED'],
      RESOLVED: [],
      REJECTED: []
    };
    return (transitions[current] ?? []).map(s => ({ value: s, label: this.statusLabel(s) }));
  }

  openHistory(interventionId: number): void {
    this.showHistoryForIntervention.set(interventionId);
    this.loadingHistory.set(true);
    this.interventionHistory.set([]);
    this.interventionService.getUpdates(interventionId).subscribe({
      next: (updates) => {
        this.interventionHistory.set(updates);
        this.loadingHistory.set(false);
      },
      error: () => {
        this.loadingHistory.set(false);
      }
    });
  }

  closeHistory(): void {
    this.showHistoryForIntervention.set(null);
  }

  private flash(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }
}
