import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import * as L from 'leaflet';
import {
  formatCoordinate,
  isInMorocco,
  MOROCCO_CENTER,
  MOROCCO_DEFAULT_ZOOM
} from '../../../shared/morocco-location';

export interface LocationPickResult {
  latitude: number;
  longitude: number;
  address: string;
}

@Component({
  selector: 'app-location-map-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-map-picker.component.html'
})
export class LocationMapPickerComponent implements AfterViewInit, OnDestroy {
  @Input() initialLat: number | null = null;
  @Input() initialLng: number | null = null;
  @Output() readonly confirmed = new EventEmitter<LocationPickResult>();
  @Output() readonly cancel = new EventEmitter<void>();

  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;

  readonly formatCoordinate = formatCoordinate;

  selectedLat: number | null = null;
  selectedLng: number | null = null;
  addressPreview = '';
  mapError = '';

  private map?: L.Map;
  private marker?: L.Marker;
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    const hasInitial =
      this.initialLat != null &&
      this.initialLng != null &&
      isInMorocco(this.initialLat, this.initialLng);

    const center: L.LatLngExpression = hasInitial
      ? [this.initialLat!, this.initialLng!]
      : [MOROCCO_CENTER.lat, MOROCCO_CENTER.lng];

    this.map = L.map(this.mapHost.nativeElement, {
      center,
      zoom: hasInitial ? 12 : MOROCCO_DEFAULT_ZOOM,
      maxBounds: [
        [20.5, -17.5],
        [36.5, -0.5]
      ],
      maxBoundsViscosity: 1
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarker(e.latlng.lat, e.latlng.lng, icon);
    });

    if (hasInitial) {
      this.setMarker(this.initialLat!, this.initialLng!, icon);
    }

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private setMarker(lat: number, lng: number, icon: L.Icon): void {
    this.mapError = '';
    if (!isInMorocco(lat, lng)) {
      this.mapError = 'Veuillez sélectionner un point situé au Maroc.';
      return;
    }
    this.selectedLat = lat;
    this.selectedLng = lng;
    if (!this.marker) {
      this.marker = L.marker([lat, lng], { icon, draggable: true }).addTo(this.map!);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.applyPosition(pos.lat, pos.lng);
      });
    } else {
      this.marker.setLatLng([lat, lng]);
    }
    void this.resolveAddress(lat, lng);
  }

  private applyPosition(lat: number, lng: number): void {
    if (!isInMorocco(lat, lng)) {
      this.mapError = 'Le marqueur doit rester au Maroc.';
      return;
    }
    this.mapError = '';
    this.selectedLat = lat;
    this.selectedLng = lng;
    void this.resolveAddress(lat, lng);
  }

  private async resolveAddress(lat: number, lng: number): Promise<void> {
    const fallback = `${formatCoordinate(lat)}, ${formatCoordinate(lng)}`;
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('format', 'json');
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lng));
      url.searchParams.set('accept-language', 'fr');
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        this.addressPreview = fallback;
        return;
      }
      const data = (await res.json()) as { display_name?: string };
      this.addressPreview = data.display_name?.trim() || fallback;
    } catch {
      this.addressPreview = fallback;
    }
  }

  confirmSelection(): void {
    if (this.selectedLat == null || this.selectedLng == null) {
      this.mapError = 'Sélectionnez un point sur la carte.';
      return;
    }
    if (!isInMorocco(this.selectedLat, this.selectedLng)) {
      this.mapError = 'La localisation doit être au Maroc.';
      return;
    }
    this.confirmed.emit({
      latitude: this.selectedLat,
      longitude: this.selectedLng,
      address: this.addressPreview || `${formatCoordinate(this.selectedLat)}, ${formatCoordinate(this.selectedLng)}`
    });
  }
}
