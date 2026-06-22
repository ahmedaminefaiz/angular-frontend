import {
  Component, Input, Output, EventEmitter, OnInit, signal
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProblemResponse } from '../../../../models/problem.models';
import { UserSummaryResponse } from '../../../../models/user-management.models';
import { ProblemsService } from '../../../../services/problems.service';

@Component({
  selector: 'app-edit-problem-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './edit-problem-form.component.html'
})
export class EditProblemFormComponent implements OnInit {
  @Input({ required: true }) problem!: ProblemResponse;
  @Input({ required: true }) agents: UserSummaryResponse[] = [];
  @Output() submitted = new EventEmitter<ProblemResponse>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly removedAlertIds = signal<Set<number>>(new Set());
  addAlertIdInput = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly problemsService: ProblemsService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [this.problem.title ?? ''],
      description: [this.problem.description ?? ''],
      assignedToId: [this.problem.assignedTo?.id ?? null]
    });
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

    this.submitting.set(true);
    this.problemsService.updateProblem(this.problem.id, {
      title: this.form.get('title')?.value || undefined,
      description: this.form.get('description')?.value || undefined,
      assignedToId: this.form.get('assignedToId')?.value || undefined,
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
}
