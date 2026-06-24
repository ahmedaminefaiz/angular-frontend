import {
  Component, Input, Output, EventEmitter, OnInit, signal
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertResponse } from '../../../../models/alert.models';
import { ProblemResponse } from '../../../../models/problem.models';
import { UserSummaryResponse } from '../../../../models/user-management.models';
import { ProblemsService } from '../../../../services/problems.service';

type FormMode = 'new' | 'existing';

@Component({
  selector: 'app-qualify-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './qualify-form.component.html'
})
export class QualifyFormComponent implements OnInit {
  @Input({ required: true }) preselectedAlerts: AlertResponse[] = [];
  @Input({ required: true }) agents: UserSummaryResponse[] = [];
  @Output() submitted = new EventEmitter<ProblemResponse>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  mode = signal<FormMode>('new');

  readonly selectedAlerts = signal<AlertResponse[]>([]);
  readonly existingProblems = signal<ProblemResponse[]>([]);
  readonly loadingProblems = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly problemsService: ProblemsService
  ) {}

  ngOnInit(): void {
    this.selectedAlerts.set([...this.preselectedAlerts]);
    this.form = this.fb.group({
      title: [''],
      description: [''],
      existingProblemId: [null]
    });
    this.loadExistingProblems();
  }

  setMode(m: FormMode): void {
    this.mode.set(m);
    this.error.set('');
  }

  removeAlert(alert: AlertResponse): void {
    this.selectedAlerts.update(arr => arr.filter(a => a.id !== alert.id));
  }

  submit(): void {
    this.error.set('');
    if (this.selectedAlerts().length === 0) {
      this.error.set('Vous devez sélectionner au moins un signalement.');
      return;
    }

    if (this.mode() === 'new') {
      this.submitting.set(true);
      this.problemsService.createProblem({
        title: this.form.get('title')?.value || undefined,
        description: this.form.get('description')?.value || undefined,
        alertIds: this.selectedAlerts().map(a => a.id)
      }).subscribe({
        next: (problem) => {
          this.submitting.set(false);
          this.submitted.emit(problem);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.error?.message ?? 'Erreur lors de la création du problème.');
        }
      });
    } else {
      const problemId = this.form.get('existingProblemId')?.value;
      if (!problemId) {
        this.error.set('Veuillez sélectionner un problème existant.');
        return;
      }
      this.submitting.set(true);
      const alertIds = this.selectedAlerts().map(a => a.id);
      this.problemsService.updateProblem(problemId, { addAlertIds: alertIds }).subscribe({
        next: (problem) => {
          this.submitting.set(false);
          this.submitted.emit(problem);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.error?.message ?? 'Erreur lors de la mise à jour du problème.');
        }
      });
    }
  }

  private loadExistingProblems(): void {
    this.loadingProblems.set(true);
    this.problemsService.getMyProblems(0, 50).subscribe({
      next: (page) => {
        this.existingProblems.set(page.content.filter(p => p.status === 'NEW' || p.status === 'IN_PROGRESS'));
        this.loadingProblems.set(false);
      },
      error: () => this.loadingProblems.set(false)
    });
  }
}
