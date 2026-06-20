import { Component, Input, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CloudinaryService } from '../../../services/cloudinary.service';

export type MediaType = 'image' | 'video';

export interface MediaSubmitPayload {
  mediaUrl: string;
  mediaType: MediaType;
}

@Component({
  selector: 'app-media-form',
  standalone: true,
  imports: [],
  templateUrl: './media-form.component.html'
})
export class MediaFormComponent {
  @Input() alertId: number = 0;
  @Input() serverError = '';
  @Output() readonly submitted = new EventEmitter<MediaSubmitPayload>();
  @Output() readonly cancelled = new EventEmitter<void>();

  private readonly cloudinary = inject(CloudinaryService);
  private readonly destroyRef = inject(DestroyRef);

  selectedType: MediaType = 'image';
  selectedFile: File | null = null;
  uploading = false;
  uploadError = '';

  get accept(): string {
    return this.selectedType === 'video' ? 'video/*' : 'image/*';
  }

  selectType(type: MediaType): void {
    if (this.selectedType === type) return;
    this.selectedType = type;
    this.selectedFile = null;
    this.uploadError = '';
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.uploadError = '';
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Sélectionnez un fichier.';
      return;
    }
    const folder = `alert/${this.alertId}/${this.selectedType}`;
    this.uploading = true;
    this.uploadError = '';
    this.cloudinary.upload(this.selectedFile, this.selectedType, folder)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (url) => {
        this.uploading = false;
        this.submitted.emit({ mediaUrl: url, mediaType: this.selectedType });
      },
      error: () => {
        this.uploading = false;
        this.uploadError = "Échec de l'upload. Vérifiez votre connexion et réessayez.";
      }
    });
  }
}