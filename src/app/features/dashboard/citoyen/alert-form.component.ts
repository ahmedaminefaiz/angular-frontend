import { Component, Input, Output, EventEmitter, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {
  AlertPriority,
  AlertResponse,
  CreateAlertRequest
} from '../../../models/alert.models';
import {
  LocationMapPickerComponent,
  LocationPickResult
} from './location-map-picker.component';
import { formatCoordinate, isInMorocco } from '../../../shared/morocco-location';
import { AlertsService } from '../../../services/alerts.service';

@Component({
  selector: 'app-alert-form',
  standalone: true,
  imports: [ReactiveFormsModule, LocationMapPickerComponent],
  templateUrl: './alert-form.component.html'
})
export class AlertFormComponent implements OnInit {
  @Input() editing: AlertResponse | null = null;
  @Input() categories: { id: number; name: string }[] = [];
  @Input() serverError = '';

  @Output() readonly submitted = new EventEmitter<CreateAlertRequest>();
  @Output() readonly cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly alertsService = inject(AlertsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group(
    {
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      latitude: [{ value: null as number | null, disabled: true }, [Validators.required]],
      longitude: [{ value: null as number | null, disabled: true }, [Validators.required]],
      address: [''],
      categoryId: this.fb.control<number | null>(null, Validators.required),
      priority: this.fb.nonNullable.control<AlertPriority>('MEDIUM')
    },
    { validators: moroccoLocationValidator }
  );

  formSubmitted = false;
  locating = false;
  locationFormError = '';
  showLocationMap = false;
  mapInitialLat: number | null = null;
  mapInitialLng: number | null = null;
  mediaError = '';
  readonly formatCoordinate = formatCoordinate;

  // Local copies so reassignment triggers CD reliably (independent of @Input mutation)
  localImages: string[] = [];
  localVideos: string[] = [];

  // Per-URL state: undefined = normal | 'selected' = marked for delete | 'deleting' = API in progress
  imageState = new Map<string, 'selected' | 'deleting'>();
  videoState = new Map<string, 'selected' | 'deleting'>();

  ngOnInit(): void {
    if (this.editing) {
      this.localImages = [...this.editing.images];
      this.localVideos = [...this.editing.videos];
      this.form.reset({
        title: this.editing.title,
        description: this.editing.description,
        latitude: this.editing.latitude,
        longitude: this.editing.longitude,
        address: this.editing.address || '',
        categoryId: this.editing.category?.id ?? null,
        priority: this.editing.priority
      });
    }
  }

  toggleImageSelect(url: string): void {
    if (this.imageState.get(url) === 'deleting') return;
    if (this.imageState.has(url)) {
      this.imageState.delete(url);
    } else {
      this.imageState.set(url, 'selected');
    }
  }

  confirmDeleteImage(url: string): void {
    if (!this.editing || this.imageState.get(url) === 'deleting') return;
    this.imageState.set(url, 'deleting');
    this.mediaError = '';
    this.alertsService.removeImage(this.editing.id, url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.editing = updated;
          this.localImages = [...updated.images];
          this.imageState.delete(url);
        },
        error: () => {
          this.imageState.delete(url);
          this.mediaError = 'Impossible de supprimer cette photo.';
        }
      });
  }

  toggleVideoSelect(url: string): void {
    if (this.videoState.get(url) === 'deleting') return;
    if (this.videoState.has(url)) {
      this.videoState.delete(url);
    } else {
      this.videoState.set(url, 'selected');
    }
  }

  confirmDeleteVideo(url: string): void {
    if (!this.editing || this.videoState.get(url) === 'deleting') return;
    this.videoState.set(url, 'deleting');
    this.mediaError = '';
    this.alertsService.removeVideo(this.editing.id, url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.editing = updated;
          this.localVideos = [...updated.videos];
          this.videoState.delete(url);
        },
        error: () => {
          this.videoState.delete(url);
          this.mediaError = 'Impossible de supprimer cette vidéo.';
        }
      });
  }

  openLocationMap(): void {
    const lat = this.form.get('latitude')?.value;
    const lng = this.form.get('longitude')?.value;
    this.mapInitialLat = typeof lat === 'number' ? lat : null;
    this.mapInitialLng = typeof lng === 'number' ? lng : null;
    this.showLocationMap = true;
  }

  onLocationPicked(result: LocationPickResult): void {
    this.applyLocation(result.latitude, result.longitude, result.address);
    this.showLocationMap = false;
    this.locationFormError = '';
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.locationFormError = 'La géolocalisation n\'est pas disponible sur cet appareil.';
      return;
    }
    this.locating = true;
    this.locationFormError = '';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating = false;
        const { latitude, longitude } = pos.coords;
        if (!isInMorocco(latitude, longitude)) {
          this.locationFormError = 'Votre position actuelle est en dehors du Maroc. Utilisez la carte.';
          return;
        }
        void this.reverseGeocodeAndApply(latitude, longitude);
      },
      () => {
        this.locating = false;
        this.locationFormError = 'Impossible d\'obtenir votre position. Autorisez la géolocalisation ou utilisez la carte.';
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  fieldInvalid(name: string): boolean {
    const control = this.form.get(name);
    if (!control) return false;
    return control.invalid && (control.touched || this.formSubmitted);
  }

  fieldError(name: string): string {
    const control = this.form.get(name);
    if (!control?.errors) return '';
    if (control.errors['required']) {
      const labels: Record<string, string> = {
        title: 'Le titre est requis (min. 3 caractères).',
        description: 'La description est requise (min. 10 caractères).',
        latitude: 'Sélectionnez une localisation sur la carte ou via GPS.',
        longitude: 'Sélectionnez une localisation sur la carte ou via GPS.',
        categoryId: 'Choisissez une catégorie.'
      };
      return labels[name] ?? 'Ce champ est requis.';
    }
    if (control.errors['minlength']) {
      return name === 'title'
        ? 'Le titre doit contenir au moins 3 caractères.'
        : 'La description doit contenir au moins 10 caractères.';
    }
    return 'Valeur invalide.';
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.locationFormError = '';
    this.form.markAllAsTouched();
    if (this.form.errors?.['outsideMorocco']) {
      this.locationFormError = 'La localisation doit être située au Maroc.';
    }
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: CreateAlertRequest = {
      title: raw.title ?? '',
      description: raw.description ?? '',
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
      address: raw.address || undefined,
      categoryId: Number(raw.categoryId),
      priority: raw.priority
    };
    this.submitted.emit(payload);
  }

  private async reverseGeocodeAndApply(lat: number, lng: number): Promise<void> {
    let address = `${formatCoordinate(lat)}, ${formatCoordinate(lng)}`;
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('format', 'json');
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lng));
      url.searchParams.set('accept-language', 'fr');
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = (await res.json()) as { display_name?: string };
        if (data.display_name?.trim()) address = data.display_name.trim();
      }
    } catch {
      /* garde les coordonnées */
    }
    this.applyLocation(lat, lng, address);
  }

  private applyLocation(lat: number, lng: number, address: string): void {
    this.form.patchValue({ latitude: lat, longitude: lng, address });
    this.form.get('latitude')?.markAsTouched();
    this.form.get('longitude')?.markAsTouched();
    this.form.updateValueAndValidity();
  }
}

const moroccoLocationValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const lat = group.get('latitude')?.value;
  const lng = group.get('longitude')?.value;
  if (lat == null || lng == null) return null;
  if (!isInMorocco(Number(lat), Number(lng))) return { outsideMorocco: true };
  return null;
};