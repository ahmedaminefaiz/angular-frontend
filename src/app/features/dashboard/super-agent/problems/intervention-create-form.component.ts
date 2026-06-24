import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InterventionService } from '../../../../services/intervention.service';
import { CloudinaryService } from '../../../../services/cloudinary.service';
import { UserManagementService } from '../../../../services/user-management.service';
import { UserSummaryResponse } from '../../../../models/user-management.models';
import {
  InterventionActionType,
  INTERVENTION_ACTION_TYPE_LABELS
} from '../../../../models/intervention.models';

@Component({
  selector: 'app-intervention-create-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './intervention-create-form.component.html'
})
export class InterventionCreateFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly interventionService = inject(InterventionService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly userManagementService = inject(UserManagementService);

  @Input({ required: true }) problemId!: number;
  @Output() created = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly agents = signal<UserSummaryResponse[]>([]);
  readonly loadingAgents = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly photos = signal<string[]>([]);
  readonly uploadingPhoto = signal(false);
  readonly photoError = signal('');

  readonly actionTypeOptions: { value: InterventionActionType; label: string }[] = [
    { value: 'VISITE_TERRAIN', label: INTERVENTION_ACTION_TYPE_LABELS['VISITE_TERRAIN'] },
    { value: 'REPARATION', label: INTERVENTION_ACTION_TYPE_LABELS['REPARATION'] },
    { value: 'INSPECTION', label: INTERVENTION_ACTION_TYPE_LABELS['INSPECTION'] },
    { value: 'TENTATIVE_RESOLUTION', label: INTERVENTION_ACTION_TYPE_LABELS['TENTATIVE_RESOLUTION'] },
    { value: 'DIAGNOSTIC', label: INTERVENTION_ACTION_TYPE_LABELS['DIAGNOSTIC'] },
    { value: 'MISE_A_JOUR_OPERATIONNELLE', label: INTERVENTION_ACTION_TYPE_LABELS['MISE_A_JOUR_OPERATIONNELLE'] }
  ];

  readonly form = this.fb.group({
    agentId: [null as number | null, Validators.required],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    actionType: ['' as InterventionActionType | '', Validators.required]
  });

  ngOnInit(): void {
    this.userManagementService.getMyAgents().subscribe({
      next: (list) => {
        this.agents.set(list);
        this.loadingAgents.set(false);
      },
      error: () => this.loadingAgents.set(false)
    });
  }

  onPhotoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingPhoto.set(true);
    this.photoError.set('');

    this.cloudinaryService.upload(file, 'image', 'interventions').subscribe({
      next: (url) => {
        this.uploadingPhoto.set(false);
        this.photos.update(list => [...list, url]);
      },
      error: () => {
        this.uploadingPhoto.set(false);
        this.photoError.set("Échec de l'upload. Réessayez.");
      }
    });

    (event.target as HTMLInputElement).value = '';
  }

  removePhoto(index: number): void {
    this.photos.update(list => list.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.errorMessage.set('');

    const values = this.form.getRawValue();
    this.interventionService.create({
      problemId: this.problemId,
      agentId: values.agentId!,
      description: values.description!,
      actionType: values.actionType as InterventionActionType,
      photos: this.photos().length > 0 ? this.photos() : undefined
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.created.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err));
      }
    });
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
}
