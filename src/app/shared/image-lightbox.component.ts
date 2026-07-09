import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  template: `
    @if (imageUrl) {
      <div class="modal-backdrop z-[60] items-center" (click)="closed.emit()">
        <button type="button" class="modal-close absolute right-4 top-4" (click)="closed.emit()">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <img [src]="imageUrl" alt="Photo" class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" (click)="$event.stopPropagation()" />
      </div>
    }
  `
})
export class ImageLightboxComponent {
  @Input() imageUrl: string | null = null;
  @Output() closed = new EventEmitter<void>();
}
