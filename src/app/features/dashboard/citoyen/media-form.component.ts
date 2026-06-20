import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CloudinaryService } from '../../../services/cloudinary.service';

export type MediaType = 'image' | 'video';

export interface MediaSubmitPayload {
  mediaUrl: string;
  description?: string;
  mediaType: MediaType;
}

@Component({
  selector: 'app-media-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './media-form.component.html'
})
export class MediaFormComponent {
  @Input() alertId: number = 0;
  @Input() serverError = '';
  @Output() readonly submitted = new EventEmitter<MediaSubmitPayload>();
  @Output() readonly cancelled = new EventEmitter<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cloudinary = inject(CloudinaryService);

  readonly form = this.fb.group({ description: [''] });

  uploading = false;
  uploadError = '';
  selectedFile: File | null = null;
  detectedType: MediaType = 'image';

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.detectedType = file.type.startsWith('video/') ? 'video' : 'image';
    this.uploadError = '';
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Sélectionnez un fichier.';
      return;
    }
    const folder = `alert/${this.alertId}/${this.detectedType}`;
    this.uploading = true;
    this.uploadError = '';
    this.cloudinary.upload(this.selectedFile, this.detectedType, folder).subscribe({
      next: (url) => {
        this.uploading = false;
        this.submitted.emit({
          mediaUrl: url,
          description: this.form.getRawValue().description || undefined,
          mediaType: this.detectedType
        });
      },
      error: () => {
        this.uploading = false;
        this.uploadError = "Échec de l'upload. Vérifiez votre connexion et réessayez.";
      }
    });
  }
}