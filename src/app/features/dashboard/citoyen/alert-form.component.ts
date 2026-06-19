import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
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
  readonly formatCoordinate = formatCoordinate;

  ngOnInit(): void {
    if (this.editing) {
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
