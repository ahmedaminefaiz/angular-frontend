import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  AddMediaRequest,
  AlertResponse,
  ApiErrorResponse,
  ApiPage,
  CreateAlertRequest,
  UpdateAlertRequest
} from '../../../models/alert.models';
import { CloudinaryService, CloudinaryResourceType } from '../../../services/cloudinary.service';
import { ProblemResponse } from '../../../models/problem.models';
import { NotificationResponse } from '../../../models/notification.models';
import { NotificationService } from '../../../services/notification.service';
import { TokenService } from '../../../core/services/token.service';
import { AlertsService } from '../../../services/alerts.service';
import { ProblemsService } from '../../../services/problems.service';
import { ProblemTypesService } from '../../../services/problem-types.service';
import { formatCoordinate, isInMorocco } from '../../../shared/morocco-location';
import {
  LocationMapPickerComponent,
  LocationPickResult
} from './location-map-picker.component';

type CitizenTab = 'alerts' | 'my-alerts' | 'approved-alerts' | 'notifications';

@Component({
  selector: 'app-citoyen-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, AsyncPipe, LocationMapPickerComponent],
  templateUrl: './citoyen-dashboard.component.html'
})
export class CitoyenDashboardComponent implements OnInit, OnDestroy {
  currentTab: CitizenTab = 'alerts';
  currentUserId: number | null = null;

  allAlertsPage: ApiPage<AlertResponse> = this.emptyPage();
  myAlertsPage: ApiPage<AlertResponse> = this.emptyPage();
  problemsPage: ApiPage<ProblemResponse> = this.emptyPage();

  allAlertsLoading = false;
  myAlertsLoading = false;
  problemsLoading = false;
  private readonly minSkeletonMs = 200;
  private readonly loadingTimers: ReturnType<typeof setTimeout>[] = [];
  pageErrorMessage = '';
  formErrorMessage = '';
  successMessage = '';

  showAlertModal = false;
  showProblemModal = false;
  showAlertFormModal = false;
  showMediaModal = false;
  showLocationMapModal = false;
  locating = false;
  locationFormError = '';
  formSubmitted = false;
  categoryList: { id: number; name: string }[] = [];
  categoryById: Record<number, string> = {};
  mapInitialLat: number | null = null;
  mapInitialLng: number | null = null;
  readonly formatCoordinate = formatCoordinate;
  selectedAlert: AlertResponse | null = null;
  selectedProblem: ProblemResponse | null = null;
  editingAlert: AlertResponse | null = null;

  mediaType: CloudinaryResourceType = 'image';
  selectedFile: File | null = null;
  uploading = false;
  deletingMediaUrl: string | null = null;
  private successMessageTimer: ReturnType<typeof setTimeout> | null = null;

  notifications: NotificationResponse[] = [];
  notificationsLoading = false;

  private readonly subscriptions = new Subscription();

  readonly alertForm;

  constructor(
    private readonly alertsService: AlertsService,
    private readonly problemsService: ProblemsService,
    private readonly problemTypesService: ProblemTypesService,
    private readonly tokenService: TokenService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly sanitizer: DomSanitizer,
    private readonly ngZone: NgZone,
    readonly notificationService: NotificationService
  ) {
    this.alertForm = this.fb.group(
      {
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
        latitude: [{ value: null as number | null, disabled: true }, [Validators.required]],
        longitude: [{ value: null as number | null, disabled: true }, [Validators.required]],
        address: [''],
        categoryId: this.fb.control<number | null>(null, Validators.required),
        priority: this.fb.nonNullable.control<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM')
      },
      { validators: moroccoLocationValidator }
    );

  }

  ngOnInit(): void {
    this.currentUserId = this.extractCurrentUserId();
    this.listenRouteTab();
    this.loadProblemTypes();
    this.subscriptions.add(
      this.notificationService.live$.subscribe(notif => {
        if (this.currentTab === 'notifications') {
          this.notifications = [notif, ...this.notifications];
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.loadingTimers.forEach((timer) => clearTimeout(timer));
    if (this.successMessageTimer) clearTimeout(this.successMessageTimer);
    this.subscriptions.unsubscribe();
  }

  get isActiveTableLoading(): boolean {
    return this.currentTab === 'my-alerts' ? this.myAlertsLoading : this.allAlertsLoading;
  }

  get activePage(): ApiPage<AlertResponse> {
    return this.currentTab === 'my-alerts' ? this.myAlertsPage : this.allAlertsPage;
  }

  get hasOpenModal(): boolean {
    return (
      this.showAlertModal ||
      this.showProblemModal ||
      this.showAlertFormModal ||
      this.showMediaModal ||
      this.showLocationMapModal
    );
  }

  changePage(nextPage: number): void {
    if (nextPage < 0) return;
    if (this.currentTab === 'my-alerts') {
      this.fetchMyAlerts(nextPage, 30);
      return;
    }
    this.fetchAllAlerts(nextPage, 30);
  }

  getRowToneClass(alert: AlertResponse): 'normal' | 'muted' | 'warning' | 'success' | 'danger' {
    if (this.currentTab === 'alerts') {
      return alert.user.id === this.currentUserId ? 'normal' : 'muted';
    }
    if (alert.status === 'IN_PROGRESS') return 'warning';
    if (alert.status === 'RESOLVED') return 'success';
    if (alert.status === 'REJECTED') return 'danger';
    return 'normal';
  }

  canManage(alert: AlertResponse): boolean {
    return alert.user.id === this.currentUserId && alert.status === 'NEW';
  }

  openAlertDetails(alert: AlertResponse): void {
    this.selectedAlert = alert;
    this.showAlertModal = true;
  }

  openProblemDetails(problem: ProblemResponse): void {
    this.selectedProblem = problem;
    this.showProblemModal = true;
  }

  openCreateForm(): void {
    this.formErrorMessage = '';
    this.successMessage = '';
    this.formSubmitted = false;
    this.locationFormError = '';
    this.editingAlert = null;
    this.alertForm.reset({
      title: '',
      description: '',
      latitude: null,
      longitude: null,
      address: '',
      categoryId: null,
      priority: 'MEDIUM'
    });
    this.loadProblemTypes();
    this.showAlertFormModal = true;
  }

  openEditForm(alert: AlertResponse): void {
    this.formSubmitted = false;
    this.locationFormError = '';
    this.editingAlert = alert;
    this.alertForm.reset({
      title: alert.title,
      description: alert.description,
      latitude: alert.latitude,
      longitude: alert.longitude,
      address: alert.address || '',
      categoryId: alert.category?.id ?? null,
      priority: alert.priority
    });
    this.loadProblemTypes();
    this.showAlertFormModal = true;
  }

  openLocationMap(): void {
    const lat = this.alertForm.get('latitude')?.value;
    const lng = this.alertForm.get('longitude')?.value;
    this.mapInitialLat = typeof lat === 'number' ? lat : null;
    this.mapInitialLng = typeof lng === 'number' ? lng : null;
    this.showLocationMapModal = true;
  }

  onLocationPicked(result: LocationPickResult): void {
    this.applyLocation(result.latitude, result.longitude, result.address);
    this.showLocationMapModal = false;
    this.locationFormError = '';
  }

  useCurrentLocation(): void {
    //debugger;
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
    this.alertForm.patchValue({ latitude: lat, longitude: lng, address });
    this.alertForm.get('latitude')?.markAsTouched();
    this.alertForm.get('longitude')?.markAsTouched();
    this.alertForm.updateValueAndValidity();
  }

  loadProblemTypes(): void {
    this.subscriptions.add(
      this.problemTypesService.getAll().subscribe((types) => {
        this.categoryList = types.map((t) => ({ id: t.id, name: t.name }));
        this.categoryById = Object.fromEntries(this.categoryList.map((c) => [c.id, c.name]));
      })
    );
  }

  fieldInvalid(name: string): boolean {
    const control = this.alertForm.get(name);
    if (!control) return false;
    return control.invalid && (control.touched || this.formSubmitted);
  }

  fieldError(name: string): string {
    const control = this.alertForm.get(name);
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

  openMediaForm(alert: AlertResponse): void {
    this.selectedAlert = alert;
    this.mediaType = 'image';
    this.selectedFile = null;
    this.uploading = false;
    this.formErrorMessage = '';
    this.showMediaModal = true;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  submitAlertForm(): void {
    this.formSubmitted = true;
    this.locationFormError = '';
    this.alertForm.markAllAsTouched();
    if (this.alertForm.errors?.['outsideMorocco']) {
      this.locationFormError = 'La localisation doit être située au Maroc.';
    }
    if (this.alertForm.invalid) return;

    this.formErrorMessage = '';
    if (this.editingAlert) {
      const updatePayload = this.alertForm.getRawValue() as UpdateAlertRequest;
      this.subscriptions.add(
        this.alertsService.updateAlert(this.editingAlert.id, updatePayload).subscribe({
          next: () => {
            this.closeAllModals();
            this.showSuccess('Votre alerte est modifiée avec succès');
            this.loadAllTabsData();
          },
          error: (err) => (this.formErrorMessage = this.extractApiError(err))
        })
      );
      return;
    }

    const raw = this.alertForm.getRawValue();
    const createPayload: CreateAlertRequest = {
      title: raw.title ?? '',
      description: raw.description ?? '',
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
      address: raw.address || undefined,
      categoryId: Number(raw.categoryId),
      priority: raw.priority
    };
    this.subscriptions.add(
      this.alertsService.createAlert(createPayload).subscribe({
        next: () => {
          this.closeAllModals();
          this.showSuccess('Votre alerte est créée avec succès');
          this.formErrorMessage = '';
          this.pageErrorMessage = '';
          this.loadAllTabsData();
        },
        error: (err) => (this.formErrorMessage = this.extractApiError(err))
      })
    );
  }

  submitMediaForm(): void {
    if (!this.selectedFile || !this.selectedAlert) return;
    this.uploading = true;
    this.formErrorMessage = '';
    const alertId = this.selectedAlert.id;
    const folder = `alerts/${alertId}/${this.mediaType}s`;

    this.subscriptions.add(
      this.cloudinaryService.upload(this.selectedFile, this.mediaType, folder).pipe(
        switchMap((url: string) => {
          const payload: AddMediaRequest = { mediaUrl: url };
          return this.mediaType === 'image'
            ? this.alertsService.addImage(alertId, payload)
            : this.alertsService.addVideo(alertId, payload);
        })
      ).subscribe({
        next: () => {
          this.uploading = false;
          this.closeAllModals();
          this.showSuccess(this.mediaType === 'image' ? 'Photo ajoutée avec succès' : 'Vidéo ajoutée avec succès');
          this.loadAllTabsData();
        },
        error: (err) => {
          this.uploading = false;
          this.formErrorMessage = this.extractApiError(err);
        }
      })
    );
  }

  deleteAlert(alertId: number): void {
    this.pageErrorMessage = '';
    this.subscriptions.add(
      this.alertsService.deleteAlert(alertId).subscribe({
        next: () => {
          this.showSuccess('Alerte supprimée avec succès');
          this.loadAllTabsData();
        },
        error: (err) => (this.pageErrorMessage = this.extractApiError(err))
      })
    );
  }

  getProblemAssignedName(problem: ProblemResponse): string {
    if (!problem.assignedTo) return 'Non assigné';
    return `${problem.assignedTo.firstName} ${problem.assignedTo.lastName}`;
  }

  closeAllModals(): void {
    this.showAlertModal = false;
    this.showProblemModal = false;
    this.showAlertFormModal = false;
    this.showMediaModal = false;
    this.showLocationMapModal = false;
    this.formErrorMessage = '';
    this.uploading = false;
    this.selectedAlert = null;
    this.selectedProblem = null;
  }

  deleteMediaImage(imageUrl: string): void {
    if (!this.editingAlert || this.deletingMediaUrl) return;
    this.deletingMediaUrl = imageUrl;
    this.subscriptions.add(
      this.alertsService.removeImage(this.editingAlert.id, imageUrl).subscribe({
        next: (updated) => {
          if (this.editingAlert) this.editingAlert = { ...this.editingAlert, images: updated.images };
          this.deletingMediaUrl = null;
          this.loadAllTabsData();
        },
        error: () => { this.deletingMediaUrl = null; }
      })
    );
  }

  deleteMediaVideo(videoUrl: string): void {
    if (!this.editingAlert || this.deletingMediaUrl) return;
    this.deletingMediaUrl = videoUrl;
    this.subscriptions.add(
      this.alertsService.removeVideo(this.editingAlert.id, videoUrl).subscribe({
        next: (updated) => {
          if (this.editingAlert) this.editingAlert = { ...this.editingAlert, videos: updated.videos };
          this.deletingMediaUrl = null;
          this.loadAllTabsData();
        },
        error: () => { this.deletingMediaUrl = null; }
      })
    );
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    if (this.successMessageTimer) clearTimeout(this.successMessageTimer);
    this.successMessageTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.successMessage = '';
        this.successMessageTimer = null;
      });
    }, 3000);
  }

  safeMapUrl(latitude: number, longitude: number): SafeResourceUrl {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const bbox = `${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
    );
  }

  private loadAllTabsData(silent = true): void {
    this.fetchAllAlerts(0, 30, !silent);
    this.fetchMyAlerts(0, 30, !silent);
    this.fetchProblems(0, 9, !silent);
  }

  private loadActiveTabData(): void {
    switch (this.currentTab) {
      case 'alerts':
        this.fetchAllAlerts(0, 30, true);
        break;
      case 'my-alerts':
        this.fetchMyAlerts(0, 30, true);
        break;
      case 'approved-alerts':
        this.fetchProblems(0, 9, true);
        break;
      case 'notifications':
        this.fetchNotifications();
        break;
      default:
        break;
    }
  }

  private fetchNotifications(): void {
    // ── MOCK DATA (test visuel) ── supprimer ce bloc et décommenter le vrai appel dessous ──
    this.notificationsLoading = true;
    setTimeout(() => this.ngZone.run(() => {
      this.notifications = [
        {
          id: 1,
          message: 'Votre alerte "Fuite d\'eau sur Avenue Hassan II" a été prise en charge et son statut est passé à EN COURS.',
          type: 'ALERT_STATUS_CHANGE',
          referenceId: 42,
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          id: 2,
          message: 'Votre alerte "Nid-de-poule Route Nationale 1" a été résolue avec succès. Merci pour votre signalement.',
          type: 'ALERT_STATUS_CHANGE',
          referenceId: 38,
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: 3,
          message: 'Votre alerte "Éclairage public défaillant - Rue Al Massira" a été rejetée. Motif : hors zone d\'intervention.',
          type: 'ALERT_STATUS_CHANGE',
          referenceId: 31,
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
          id: 4,
          message: 'Votre alerte "Dépôt sauvage de déchets - Quartier Hay Riad" est en cours de traitement par nos équipes.',
          type: 'ALERT_STATUS_CHANGE',
          referenceId: 27,
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
        }
      ];
      this.notificationsLoading = false;
      // Simule 2 non-lues dans le badge sidebar
      this.notificationService.setUnreadCount(2);
    }), 400);
    // ── FIN MOCK ─────────────────────────────────────────────────────────────────────────────
    // ── VRAI APPEL API (décommenter quand le backend est prêt) ──────────────────────────────
    // this.notificationsLoading = true;
    // this.subscriptions.add(
    //   this.notificationService.getNotifications(0, 50).subscribe({
    //     next: (res) => {
    //       this.notifications = res.content;
    //       this.notificationsLoading = false;
    //     },
    //     error: () => { this.notificationsLoading = false; }
    //   })
    // );
  }

  markNotifAsRead(id: number): void {
    this.subscriptions.add(
      this.notificationService.markAsRead(id).subscribe({
        next: (updated) => {
          const idx = this.notifications.findIndex(n => n.id === id);
          if (idx >= 0) this.notifications = [
            ...this.notifications.slice(0, idx),
            updated,
            ...this.notifications.slice(idx + 1)
          ];
          this.notificationService.decrementUnread();
        },
        error: () => {}
      })
    );
  }

  markAllNotifsAsRead(): void {
    this.subscriptions.add(
      this.notificationService.markAllAsRead().subscribe({
        next: () => {
          this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
          this.notificationService.resetUnread();
        },
        error: () => {}
      })
    );
  }

  private fetchAllAlerts(page: number, size: number, showSkeleton = true): void {
    const startedAt = Date.now();
    if (showSkeleton) this.allAlertsLoading = true;
    this.subscriptions.add(
      this.alertsService.getAlerts(page, size).subscribe({
        next: (response) => {
          this.allAlertsPage = response;
          this.finishLoading(showSkeleton, startedAt, () => (this.allAlertsLoading = false));
        },
        error: (err) => {
          this.setPageError(err);
          this.finishLoading(showSkeleton, startedAt, () => (this.allAlertsLoading = false));
        }
      })
    );
  }

  private fetchMyAlerts(page: number, size: number, showSkeleton = true): void {
    const startedAt = Date.now();
    if (showSkeleton) this.myAlertsLoading = true;
    this.subscriptions.add(
      this.alertsService.getMyAlerts(page, size).subscribe({
        next: (response) => {
          this.myAlertsPage = response;
          this.finishLoading(showSkeleton, startedAt, () => (this.myAlertsLoading = false));
        },
        error: (err) => {
          this.setPageError(err);
          this.finishLoading(showSkeleton, startedAt, () => (this.myAlertsLoading = false));
        }
      })
    );
  }

  private fetchProblems(page: number, size: number, showSkeleton = true): void {
    const startedAt = Date.now();
    if (showSkeleton) this.problemsLoading = true;
    this.subscriptions.add(
      this.problemsService.getProblemsRelatedToMyAlerts(page, size).subscribe({
        next: (response) => {
          this.problemsPage = response;
          this.finishLoading(showSkeleton, startedAt, () => (this.problemsLoading = false));
        },
        error: (err) => {
          this.setPageError(err);
          this.finishLoading(showSkeleton, startedAt, () => (this.problemsLoading = false));
        }
      })
    );
  }

  private finishLoading(showSkeleton: boolean, startedAt: number, done: () => void): void {
    if (!showSkeleton) {
      done();
      return;
    }
    const remaining = this.minSkeletonMs - (Date.now() - startedAt);
    if (remaining <= 0) {
      done();
      return;
    }
    const timer = setTimeout(() => this.ngZone.run(done), remaining);
    this.loadingTimers.push(timer);
  }

  private setPageError(err: unknown): void {
    if (!this.hasOpenModal) {
      this.pageErrorMessage = this.extractApiError(err);
    }
  }

  private listenRouteTab(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const tab = (params.get('tab') || 'alerts') as CitizenTab;
        this.currentTab = this.isCitizenTab(tab) ? tab : 'alerts';
        this.pageErrorMessage = '';
        this.loadActiveTabData();
      })
    );
  }

  private isCitizenTab(value: string): value is CitizenTab {
    return value === 'alerts' || value === 'my-alerts' || value === 'approved-alerts' || value === 'notifications';
  }

  private extractCurrentUserId(): number | null {
    const token = this.tokenService.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const candidate = payload.userId ?? payload.id ?? payload.sub;
      const numeric = Number(candidate);
      return Number.isFinite(numeric) ? numeric : null;
    } catch {
      return null;
    }
  }

  private extractApiError(err: unknown): string {
    if (!err) return 'Une erreur inattendue est survenue.';

    if (typeof err === 'string') return err;

    const httpErr = err as { status?: number; error?: unknown; message?: string };
    if (httpErr.status === 0) {
      return 'Connexion au serveur impossible. Vérifiez que le backend tourne et que CORS autorise localhost:4200.';
    }

    const body = httpErr.error;
    if (typeof body === 'string') return body;
    if (body && typeof body === 'object') {
      const apiBody = body as ApiErrorResponse;
      return apiBody.message || apiBody.error || 'Une erreur inattendue est survenue.';
    }

    if (httpErr.message) return httpErr.message;
    return 'Une erreur inattendue est survenue.';
  }

  private emptyPage<T = never>(): ApiPage<T> {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 30,
      number: 0
    };
  }
}

const moroccoLocationValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const lat = group.get('latitude')?.value;
  const lng = group.get('longitude')?.value;
  if (lat == null || lng == null) return null;
  if (!isInMorocco(Number(lat), Number(lng))) return { outsideMorocco: true };
  return null;
};
