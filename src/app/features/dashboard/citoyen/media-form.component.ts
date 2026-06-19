import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddMediaRequest } from '../../../models/alert.models';

@Component({
  selector: 'app-media-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './media-form.component.html'
})
export class MediaFormComponent {
  @Input() serverError = '';
  @Output() readonly submitted = new EventEmitter<AddMediaRequest>();
  @Output() readonly cancelled = new EventEmitter<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    mediaUrl: ['', [Validators.required]],
    description: ['']
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitted.emit(this.form.getRawValue());
  }
}
