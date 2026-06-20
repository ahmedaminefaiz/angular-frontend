import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AlertResponse } from '../../../models/alert.models';

@Component({
  selector: 'app-alert-detail-modal',
  standalone: true,
  imports: [],
  templateUrl: './alert-detail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertDetailModalComponent {
  @Input({ required: true }) alert!: AlertResponse;
  @Input() canManage = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly removeImage = new EventEmitter<string>();
  @Output() readonly removeVideo = new EventEmitter<string>();

  private readonly sanitizer = inject(DomSanitizer);

  safeMapUrl(latitude: number, longitude: number): SafeResourceUrl {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const bbox = `${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
    );
  }
}