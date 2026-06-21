import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProblemTypesService } from '../../../../services/problem-types.service';
import { ProblemTypeSummary } from '../../../../models/alert.models';

@Component({
  selector: 'app-admin-problem-types',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-problem-types.component.html'
})
export class AdminProblemTypesComponent implements OnInit {
  readonly loading = signal(true);
  readonly types = signal<ProblemTypeSummary[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  showCreateForm = false;
  editingId: number | null = null;

  createName = '';
  createIcon = '';

  editName = '';
  editIcon = '';

  deletingId: number | null = null;
  saving = false;

  constructor(private readonly problemTypesService: ProblemTypesService) {}

  ngOnInit() {
    this.loadTypes();
  }

  openCreate() {
    this.createName = '';
    this.createIcon = '';
    this.showCreateForm = true;
    this.editingId = null;
    this.clearMessages();
  }

  cancelCreate() {
    this.showCreateForm = false;
  }

  submitCreate() {
    if (!this.createName.trim()) return;
    this.saving = true;
    this.clearMessages();
    this.problemTypesService.create({
      name: this.createName.trim(),
      icon: this.createIcon.trim() || undefined
    }).subscribe({
      next: () => {
        this.successMessage.set('Type créé avec succès.');
        this.showCreateForm = false;
        this.saving = false;
        this.loadTypes();
      },
      error: (err) => {
        this.errorMessage.set(this.extractError(err));
        this.saving = false;
      }
    });
  }

  openEdit(type: ProblemTypeSummary) {
    this.editingId = type.id;
    this.editName = type.name;
    this.editIcon = type.icon ?? '';
    this.showCreateForm = false;
    this.clearMessages();
  }

  cancelEdit() {
    this.editingId = null;
  }

  submitEdit() {
    if (this.editingId === null || !this.editName.trim()) return;
    this.saving = true;
    this.clearMessages();
    this.problemTypesService.update(this.editingId, {
      name: this.editName.trim(),
      icon: this.editIcon.trim() || undefined
    }).subscribe({
      next: () => {
        this.successMessage.set('Type modifié avec succès.');
        this.editingId = null;
        this.saving = false;
        this.loadTypes();
      },
      error: (err) => {
        this.errorMessage.set(this.extractError(err));
        this.saving = false;
      }
    });
  }

  confirmDelete(id: number) {
    this.deletingId = id;
    this.clearMessages();
  }

  cancelDelete() {
    this.deletingId = null;
  }

  submitDelete() {
    if (this.deletingId === null) return;
    this.saving = true;
    this.problemTypesService.delete(this.deletingId).subscribe({
      next: () => {
        this.successMessage.set('Type supprimé avec succès.');
        this.deletingId = null;
        this.saving = false;
        this.loadTypes();
      },
      error: (err) => {
        this.errorMessage.set(this.extractError(err));
        this.deletingId = null;
        this.saving = false;
      }
    });
  }

  private loadTypes() {
    this.loading.set(true);
    this.problemTypesService.getAll().subscribe({
      next: (list) => {
        this.types.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private clearMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private extractError(err: unknown): string {
    const e = err as { error?: string | { message?: string }; message?: string };
    if (typeof e?.error === 'string') return e.error;
    if (e?.error && typeof e.error === 'object') return (e.error as { message?: string }).message ?? 'Erreur inconnue.';
    return e?.message ?? 'Erreur inconnue.';
  }
}
