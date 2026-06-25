import {
  Component, Input, Output, EventEmitter, OnInit, signal
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CriticalityResponse, ProblemResponse } from '../../../../models/problem.models';
import { ProblemsService } from '../../../../services/problems.service';
import { CriticalityService } from '../../../../services/criticality.service';

@Component({
  selector: 'app-edit-problem-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './edit-problem-form.component.html'
})
export class EditProblemFormComponent implements OnInit {
  @Input({ required: true }) problem!: ProblemResponse;
  @Output() submitted = new EventEmitter<ProblemResponse>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly removedAlertIds = signal<Set<number>>(new Set());
  readonly criticalities = signal<CriticalityResponse[]>([]);
  readonly loadingCriticalities = signal(false);
  addAlertIdInput = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly problemsService: ProblemsService,
    private readonly criticalityService: CriticalityService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [this.problem.title ?? ''],
      description: [this.problem.description ?? ''],
      criticalityId: [this.problem.criticality?.id ?? null]
    });
    this.loadCriticalities();
  }

  get currentAlerts() {
    return this.problem.alerts.filter(a => !this.removedAlertIds().has(a.id));
  }

  removeAlert(alertId: number): void {
    this.removedAlertIds.update(set => new Set([...set, alertId]));
  }

  submit(): void {
    this.error.set('');
    const addIds = this.addAlertIdInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));

    const criticalityId = this.form.get('criticalityId')?.value;

    this.submitting.set(true);
    this.problemsService.updateProblem(this.problem.id, {
      title: this.form.get('title')?.value || undefined,
      description: this.form.get('description')?.value || undefined,
      criticalityId: criticalityId ? Number(criticalityId) : undefined,
      addAlertIds: addIds.length > 0 ? addIds : undefined,
      removeAlertIds: this.removedAlertIds().size > 0 ? [...this.removedAlertIds()] : undefined
    }).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.submitted.emit(updated);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Erreur lors de la mise à jour.');
      }
    });
  }

  private loadCriticalities(): void {
    this.loadingCriticalities.set(true);
    this.criticalityService.getAll().subscribe({
      next: (list) => { this.criticalities.set(list); this.loadingCriticalities.set(false); },
      error: () => this.loadingCriticalities.set(false)
    });
  }
}