import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  AlertResponse,
  ApiErrorResponse,
  ApiPage
} from '../../../models/alert.models';
import { ProblemResponse } from '../../../models/problem.models';
import { TokenService } from '../../../core/services/token.service';
import { AlertsService } from '../../../services/alerts.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { ProblemsService } from '../../../services/problems.service';
import { ProblemTypesService } from '../../../services/problem-types.service';
import { AlertTableComponent } from './alert-table.component';
import { AlertDetailModalComponent } from './alert-detail-modal.component';
import { AlertFormComponent, AlertFormSubmit, StagedMedia } from './alert-form.component';
import { MediaFormComponent, MediaSubmitPayload } from './media-form.component';
import { ApprovedAlertsComponent } from './approved-alerts.component';
import { NotificationListComponent } from './notification-list.component';

type CitizenTab = 'alerts' | 'my-alerts' | 'approved-alerts' | 'notifications';

@Component({
  selector: 'app-citoyen-dashboard',
  standalone: true,
  imports: [
    AlertTableComponent,
    AlertDetailModalComponent,
    AlertFormComponent,
    MediaFormComponent,
    ApprovedAlertsComponent,
    NotificationListComponent
  ],
  templateUrl: './citoyen-dashboard.component.html'
})
export class CitoyenDashboardComponent implements OnInit, OnDestroy {
  readonly currentTab = signal<CitizenTab>('alerts');
  currentUserId: number | null = null;

  readonly allAlertsPage = signal<ApiPage<AlertResponse>>({ content: [], totalElements: 0, totalPages: 0, size: 30, number: 0 });
  readonly myAlertsPage = signal<ApiPage<AlertResponse>>({ content: [], totalElements: 0, totalPages: 0, size: 30, number: 0 });
  readonly problemsPage = signal<ApiPage<ProblemResponse>>({ content: [], totalElements: 0, totalPages: 0, size: 9, number: 0 });

  readonly allAlertsLoading = signal(false);
  readonly myAlertsLoading = signal(false);

  readonly pageErrorMessage = signal('');
  readonly successMessage = signal('');
  readonly alertFormError = signal('');
  readonly mediaFormError = signal('');

  showAlertModal = false;
  showAlertFormModal = false;
  showMediaModal = false;

  selectedAlert: AlertResponse | null = null;
  editingAlert: AlertResponse | null = null;

  readonly categoryList = signal<{ id: number; name: string }[]>([]);

  private readonly minSkeletonMs = 300;
  private readonly loadingTimers: ReturnType<typeof setTimeout>[] = [];
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly alertsService: AlertsService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly problemsService: ProblemsService,
    private readonly problemTypesService: ProblemTypesService,
    private readonly tokenService: TokenService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId();
    this.loadProblemTypes();
    this.fetchMyAlerts(0, 30, false);
    this.listenRouteTab();
  }

  ngOnDestroy(): void {
    this.loadingTimers.forEach((t) => clearTimeout(t));
    this.subscriptions.unsubscribe();
  }

  readonly isActiveTableLoading = computed(() =>
    this.currentTab() === 'my-alerts' ? this.myAlertsLoading() : this.allAlertsLoading()
  );

  readonly activePage = computed(() =>
    this.currentTab() === 'my-alerts' ? this.myAlertsPage() : this.allAlertsPage()
  );

  readonly activeAlertTab = computed<'alerts' | 'my-alerts'>(() =>
    this.currentTab() === 'my-alerts' ? 'my-alerts' : 'alerts'
  );

  get hasOpenModal(): boolean {
    return this.showAlertModal || this.showAlertFormModal || this.showMediaModal;
  }

  get canManageSelected(): boolean {
    if (!this.selectedAlert) return false;
    return this.selectedAlert.user.id === this.currentUserId && this.selectedAlert.status === 'NEW';
  }

  get myAlertsInProgress(): number {
    return this.myAlertsPage().content.filter(a => a.status === 'NEW' || a.status === 'IN_PROGRESS').length;
  }

  get myAlertsResolved(): number {
    return this.myAlertsPage().content.filter(a => a.status === 'RESOLVED').length;
  }

  changePage(nextPage: number): void {
    if (nextPage < 0) return;
    if (this.currentTab() === 'my-alerts') {
      this.fetchMyAlerts(nextPage, 30);
      return;
    }
    this.fetchAllAlerts(nextPage, 30);
  }

  openAlertDetails(alert: AlertResponse): void {
    this.selectedAlert = alert;
    this.showAlertModal = true;
  }

  openCreateForm(): void {
    this.editingAlert = null;
    this.alertFormError.set('');
    this.showAlertFormModal = true;
  }

  openEditForm(alert: AlertResponse): void {
    this.editingAlert = alert;
    this.alertFormError.set('');
    this.showAlertFormModal = true;
  }

  openMediaForm(alert: AlertResponse): void {
    this.selectedAlert = alert;
    this.mediaFormError.set('');
    this.showMediaModal = true;
  }

  closeAllModals(): void {
    this.showAlertModal = false;
    this.showAlertFormModal = false;
    this.showMediaModal = false;
    this.alertFormError.set('');
    this.mediaFormError.set('');
    this.selectedAlert = null;
  }

  onAlertFormSubmitted(result: AlertFormSubmit): void {
    this.alertFormError.set('');
    const { payload, newMedia } = result;
    const editing = this.editingAlert;
    const save$ = editing
      ? this.alertsService.updateAlert(editing.id, payload)
      : this.alertsService.createAlert(payload);
    const successText = editing
      ? 'Votre alerte est modifiée avec succès'
      : 'Votre alerte est créée avec succès';

    this.subscriptions.add(
      save$.pipe(
        switchMap((saved) => this.uploadAndAttachMedia(saved.id, newMedia))
      ).subscribe({
        next: () => {
          this.closeAllModals();
          this.successMessage.set(successText);
          this.loadAllTabsData();
        },
        error: (err) => this.alertFormError.set(this.extractApiError(err))
      })
    );
  }

  /**
   * Uploads each staged file to Cloudinary then attaches its URL to the alert.
   * Runs after the alert is saved so we have its ID for the media folder.
   */
  private uploadAndAttachMedia(alertId: number, media: StagedMedia[]): Observable<unknown> {
    if (!media.length) return of(null);
    const calls = media.map((m) =>
      this.cloudinaryService.upload(m.file, m.type, `alert/${alertId}/${m.type}`).pipe(
        switchMap((url) =>
          m.type === 'video'
            ? this.alertsService.addVideo(alertId, { mediaUrl: url })
            : this.alertsService.addImage(alertId, { mediaUrl: url })
        )
      )
    );
    return forkJoin(calls);
  }

  onMediaFormSubmitted(payload: MediaSubmitPayload): void {
    this.mediaFormError.set('');
    if (!this.selectedAlert) return;
    const call = payload.mediaType === 'video'
      ? this.alertsService.addVideo(this.selectedAlert.id, { mediaUrl: payload.mediaUrl })
      : this.alertsService.addImage(this.selectedAlert.id, { mediaUrl: payload.mediaUrl });
    this.subscriptions.add(
      call.subscribe({
        next: () => {
          this.closeAllModals();
          this.successMessage.set('Média ajouté avec succès');
          this.loadAllTabsData();
        },
        error: (err) => this.mediaFormError.set(this.extractApiError(err))
      })
    );
  }

  onRemoveImage(imageUrl: string): void {
    if (!this.selectedAlert) return;
    this.subscriptions.add(
      this.alertsService.removeImage(this.selectedAlert.id, imageUrl).subscribe({
        next: (updated) => {
          this.selectedAlert = updated;
          this.successMessage.set('Photo supprimée avec succès');
          this.loadAllTabsData();
        },
        error: (err) => this.pageErrorMessage.set(this.extractApiError(err))
      })
    );
  }

  onRemoveVideo(videoUrl: string): void {
    if (!this.selectedAlert) return;
    this.subscriptions.add(
      this.alertsService.removeVideo(this.selectedAlert.id, videoUrl).subscribe({
        next: (updated) => {
          this.selectedAlert = updated;
          this.successMessage.set('Vidéo supprimée avec succès');
          this.loadAllTabsData();
        },
        error: (err) => this.pageErrorMessage.set(this.extractApiError(err))
      })
    );
  }

  deleteAlert(alertId: number): void {
    this.pageErrorMessage.set('');
    this.subscriptions.add(
      this.alertsService.deleteAlert(alertId).subscribe({
        next: () => {
          this.successMessage.set('Alerte supprimée avec succès');
          this.loadAllTabsData();
        },
        error: (err) => this.pageErrorMessage.set(this.extractApiError(err))
      })
    );
  }

  private loadProblemTypes(): void {
    this.subscriptions.add(
      this.problemTypesService.getAll().subscribe((types) => {
        this.categoryList.set(types.map((t) => ({ id: t.id, name: t.name })));
      })
    );
  }

  private loadAllTabsData(): void {
    this.fetchAllAlerts(0, 30, false);
    this.fetchMyAlerts(0, 30, false);
    this.fetchProblems();
  }

  private fetchProblems(): void {
    this.subscriptions.add(
      this.problemsService.getProblemsRelatedToMyAlerts(0, 9).subscribe({
        next: (data) => this.problemsPage.set(data),
        error: () => {}
      })
    );
  }

  private loadActiveTabData(): void {
    switch (this.currentTab()) {
      case 'alerts': this.fetchAllAlerts(0, 30, true); break;
      case 'my-alerts': this.fetchMyAlerts(0, 30, true); break;
      default: break;
    }
  }

  private fetchAllAlerts(page: number, size: number, showSkeleton = true): void {
    const startedAt = Date.now();
    if (showSkeleton) this.allAlertsLoading.set(true);
    this.subscriptions.add(
      this.alertsService.getAlerts(page, size).subscribe({
        next: (response) => {
          this.allAlertsPage.set(response);
          this.finishLoading(showSkeleton, startedAt, () => this.allAlertsLoading.set(false));
        },
        error: (err) => {
          this.setPageError(err);
          this.finishLoading(showSkeleton, startedAt, () => this.allAlertsLoading.set(false));
        }
      })
    );
  }

  private fetchMyAlerts(page: number, size: number, showSkeleton = true): void {
    const startedAt = Date.now();
    if (showSkeleton) this.myAlertsLoading.set(true);
    this.subscriptions.add(
      this.alertsService.getMyAlerts(page, size).subscribe({
        next: (response) => {
          this.myAlertsPage.set(response);
          this.finishLoading(showSkeleton, startedAt, () => this.myAlertsLoading.set(false));
        },
        error: (err) => {
          this.setPageError(err);
          this.finishLoading(showSkeleton, startedAt, () => this.myAlertsLoading.set(false));
        }
      })
    );
  }

  private finishLoading(showSkeleton: boolean, startedAt: number, done: () => void): void {
    if (!showSkeleton) { done(); return; }
    const remaining = this.minSkeletonMs - (Date.now() - startedAt);
    if (remaining <= 0) { done(); return; }
    const timer = setTimeout(done, remaining);
    this.loadingTimers.push(timer);
  }

  private setPageError(err: unknown): void {
    if (!this.hasOpenModal) {
      this.pageErrorMessage.set(this.extractApiError(err));
    }
  }

  private listenRouteTab(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const tab = (params.get('tab') || 'alerts') as CitizenTab;
        this.currentTab.set(this.isCitizenTab(tab) ? tab : 'alerts');
        this.pageErrorMessage.set('');
        this.loadActiveTabData();
      })
    );
  }

  private isCitizenTab(value: string): value is CitizenTab {
    return value === 'alerts' || value === 'my-alerts' || value === 'approved-alerts' || value === 'notifications';
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
}
