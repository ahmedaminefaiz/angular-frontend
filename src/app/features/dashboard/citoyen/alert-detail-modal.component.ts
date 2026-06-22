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

  readonly imgPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='8' fill='%23f1f5f9'/%3E%3Crect x='20' y='20' width='56' height='56' rx='4' stroke='%23cbd5e1' stroke-width='2' fill='none'/%3E%3Ccircle cx='36' cy='40' r='7' fill='%23e2e8f0'/%3E%3Cpath d='M20 72 L38 50 L50 62 L62 48 L76 72Z' fill='%23e2e8f0'/%3E%3C/svg%3E";

  safeMapUrl(latitude: number, longitude: number): SafeResourceUrl {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const bbox = `${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
    );
  }
}