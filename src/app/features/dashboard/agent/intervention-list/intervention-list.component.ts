import { Component, Input, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { InterventionService } from '../../../../services/intervention.service';
import { CloudinaryService } from '../../../../services/cloudinary.service';
import { TokenService } from '../../../../core/services/token.service';
import { ImageLightboxComponent } from '../../../../shared/image-lightbox.component';
import { isPdfReport } from '../../../../shared/report-utils';
import {
  InterventionResponse,
  InterventionStatus,
  InterventionUpdateResponse,
  INTERVENTION_STATUS_LABELS,
  INTERVENTION_ACTION_TYPE_LABELS
} from '../../../../models/intervention.models';

@Component({
  selector: 'app-intervention-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageLightboxComponent],
  templateUrl: './intervention-list.component.html'
})
export class InterventionListComponent implements OnInit, OnDestroy {
  private readonly interventionService = inject(InterventionService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly tokenService = inject(TokenService);
  private readonly fb = inject(FormBuilder);
  private readonly subscriptions = new Subscription();

  @Input() problemId?: number;

  readonly interventions = signal<InterventionResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly loading = signal(true);
  readonly pageSize = 10;

  readonly selectedIntervention = signal<InterventionResponse | null>(null);
  readonly showDetailModal = signal(false);
  readonly showEditModal = signal(false);
  readonly viewedImage = signal<string | null>(null);

  // Edit modal — earliest date/time allowed for the new status (creation date of the intervention)
  readonly minStatusDate = computed(() => {
    const intervention = this.selectedIntervention();
    return intervention ? this.toDatetimeLocal(intervention.interventionDate) : null;
  });

  // Detail modal — update history
  readonly interventionUpdates = signal<InterventionUpdateResponse[]>([]);
  readonly loadingUpdates = signal(false);

  // Edit modal — new update form
  readonly uploadingPhoto = signal(false);
  readonly updatePhotos = signal<string[]>([]);
  readonly photoError = signal('');
  readonly reportMode = signal<'text' | 'pdf'>('text');
  readonly uploadingReportPdf = signal(false);
  readonly reportPdfName = signal('');
  readonly reportPdfError = signal('');
  readonly submitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');
  readonly currentUserId = signal<number | null>(null);

  readonly statusLabels = INTERVENTION_STATUS_LABELS;
  readonly actionTypeLabels = INTERVENTION_ACTION_TYPE_LABELS;

  readonly agentStatusOptions: { value: InterventionStatus; label: string }[] = [
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'SUSPENDUE', label: 'Suspendue' },
    { value: 'EN_ATTENTE_AUTRE_EQUIPE', label: "En attente d'une autre équipe" },
    { value: 'RESOLUE', label: 'Résolue' },
    { value: 'PARTIELLEMENT_RESOLUE', label: 'Partiellement résolue' },
    { value: 'ECHEC_INTERVENTION', label: "Échec d'intervention" }
  ];

  readonly form = this.fb.group({
    rapport: ['', [Validators.required, Validators.maxLength(5000)]],
    status: ['' as InterventionStatus | '', Validators.required],
    statusDate: ['', Validators.required]
  });

  ngOnInit(): void {
    this.currentUserId.set(this.tokenService.getUserId());
    this.loadInterventions(0);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadInterventions(page: number): void {
    this.loading.set(true);
    const obs = this.problemId
      ? this.interventionService.getByProblem(this.problemId, page, this.pageSize)
      : this.interventionService.getMyInterventions(page, this.pageSize);

    const sub = obs.subscribe({
      next: (response) => {
        this.interventions.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.currentPage.set(response.number);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  refresh(): void {
    this.loadInterventions(this.currentPage());
  }

  onPageChange(page: number): void {
    this.loadInterventions(page);
  }

  // ========== Detail Modal ==========

  openDetail(intervention: InterventionResponse): void {
    this.selectedIntervention.set(intervention);
    this.interventionUpdates.set([]);
    this.loadingUpdates.set(true);
    this.showDetailModal.set(true);

    const sub = this.interventionService.getUpdates(intervention.id).subscribe({
      next: (updates) => {
        this.interventionUpdates.set(updates);
        this.loadingUpdates.set(false);
      },
      error: () => {
        this.loadingUpdates.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  // ========== Edit Modal ==========

  openEdit(intervention: InterventionResponse): void {
    this.selectedIntervention.set(intervention);
    this.errorMessage.set('');
    this.photoError.set('');
    this.updatePhotos.set([]);
    this.reportMode.set('text');
    this.reportPdfName.set('');
    this.reportPdfError.set('');
    this.form.reset({ rapport: '', status: '', statusDate: '' });
    this.form.controls.statusDate.setValidators([
      Validators.required,
      this.minDateValidator(intervention.interventionDate)
    ]);
    this.form.controls.statusDate.updateValueAndValidity();
    this.showEditModal.set(true);
  }

  closeModals(): void {
    this.showDetailModal.set(false);
    this.showEditModal.set(false);
    this.selectedIntervention.set(null);
    this.photoError.set('');
    this.errorMessage.set('');
    this.updatePhotos.set([]);
    this.reportPdfName.set('');
    this.reportPdfError.set('');
  }

  canEdit(intervention: InterventionResponse): boolean {
    return intervention.agentId === this.currentUserId() && intervention.status !== 'CLOTUREE';
  }

  // ========== Form submit ==========

  get rapportLength(): number {
    return this.form.controls.rapport.value?.length ?? 0;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedIntervention()) return;
    this.submitting.set(true);
    this.errorMessage.set('');

    const values = this.form.getRawValue();
    const id = this.selectedIntervention()!.id;

    const sub = this.interventionService.createUpdate(id, {
      rapport: values.rapport!,
      status: values.status as InterventionStatus,
      statusDate: values.statusDate!,
      photos: this.updatePhotos().length > 0 ? this.updatePhotos() : undefined
    }).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.updateLocalIntervention(updated);
        this.closeModals();
        this.flash('Mise à jour enregistrée avec succès');
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err));
      }
    });
    this.subscriptions.add(sub);
  }

  // ========== Rapport: texte ou PDF ==========

  readonly isPdfReport = isPdfReport;

  setReportMode(mode: 'text' | 'pdf'): void {
    this.reportMode.set(mode);
    this.reportPdfName.set('');
    this.reportPdfError.set('');
    this.form.patchValue({ rapport: '' });
  }

  onReportPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const interv = this.selectedIntervention();
    if (!file || !interv) return;

    if (file.type !== 'application/pdf') {
      this.reportPdfError.set('Seuls les fichiers PDF sont acceptés.');
      (event.target as HTMLInputElement).value = '';
      return;
    }

    this.uploadingReportPdf.set(true);
    this.reportPdfError.set('');

    const folder = `interventions/${interv.id}/updates/reports`;
    const sub = this.cloudinaryService.upload(file, 'raw', folder).subscribe({
      next: (url) => {
        this.uploadingReportPdf.set(false);
        this.reportPdfName.set(file.name);
        this.form.patchValue({ rapport: url });
      },
      error: () => {
        this.uploadingReportPdf.set(false);
        this.reportPdfError.set("Échec de l'upload du PDF. Réessayez.");
      }
    });
    this.subscriptions.add(sub);

    (event.target as HTMLInputElement).value = '';
  }

  removeReportPdf(): void {
    this.reportPdfName.set('');
    this.form.patchValue({ rapport: '' });
  }

  // ========== Photos for new update ==========

  onPhotoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const interv = this.selectedIntervention();
    if (!file || !interv) return;

    this.uploadingPhoto.set(true);
    this.photoError.set('');

    const folder = `interventions/${interv.id}/updates`;
    const sub = this.cloudinaryService.upload(file, 'image', folder).subscribe({
      next: (url) => {
        this.uploadingPhoto.set(false);
        this.updatePhotos.update(photos => [...photos, url]);
      },
      error: () => {
        this.uploadingPhoto.set(false);
        this.photoError.set("Échec de l'upload. Réessayez.");
      }
    });
    this.subscriptions.add(sub);

    (event.target as HTMLInputElement).value = '';
  }

  removeUpdatePhoto(index: number): void {
    this.updatePhotos.update(photos => photos.filter((_, i) => i !== index));
  }

  // ========== Helpers ==========

  private minDateValidator(minIso: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const min = new Date(minIso);
      const value = new Date(control.value);
      return value < min ? { minDate: true } : null;
    };
  }

  private toDatetimeLocal(iso: string): string {
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private updateLocalIntervention(updated: InterventionResponse): void {
    this.interventions.update(list =>
      list.map(i => i.id === updated.id ? updated : i)
    );
  }

  private flash(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  private extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const httpErr = err as { error?: { message?: string } | string; status?: number };
      if (httpErr.status === 0) return 'Erreur réseau. Vérifiez votre connexion.';
      if (typeof httpErr.error === 'string') return httpErr.error;
      if (httpErr.error && typeof httpErr.error === 'object' && httpErr.error.message) return httpErr.error.message;
    }
    return 'Une erreur inattendue est survenue.';
  }

  getStatusClass(status: InterventionStatus): string {
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

  getStatusDot(status: InterventionStatus): string {
    const colors: Record<InterventionStatus, string> = {
      AFFECTEE: 'dot-info',
      EN_COURS: 'dot-amber',
      SUSPENDUE: 'dot-amber',
      EN_ATTENTE_AUTRE_EQUIPE: 'dot-muted',
      RESOLUE: 'dot-ok',
      PARTIELLEMENT_RESOLUE: 'dot-ok',
      ECHEC_INTERVENTION: 'dot-crit',
      CLOTUREE: 'dot-muted'
    };
    return colors[status] || 'dot-muted';
  }

  truncate(text: string | undefined, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '…' : text;
  }
}
