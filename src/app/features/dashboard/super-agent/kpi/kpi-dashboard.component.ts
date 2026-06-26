import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, startWith, catchError, EMPTY } from 'rxjs';
import { KpiService } from '../../../../services/kpi.service';
import { UserManagementService } from '../../../../services/user-management.service';
import { KpiDashboard, KpiFilters } from '../../../../models/kpi.models';
import { UserSummaryResponse } from '../../../../models/user-management.models';
import { KpiFilterBarComponent } from './kpi-filter-bar.component';
import { KpiAlertSectionComponent } from './kpi-alert-section.component';
import { KpiProblemSectionComponent } from './kpi-problem-section.component';
import { KpiInterventionSectionComponent } from './kpi-intervention-section.component';
import { KpiAgentTableComponent } from './kpi-agent-table.component';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [
    KpiFilterBarComponent,
    KpiAlertSectionComponent,
    KpiProblemSectionComponent,
    KpiInterventionSectionComponent,
    KpiAgentTableComponent
  ],
  templateUrl: './kpi-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiDashboardComponent implements OnInit {
  private readonly kpiService = inject(KpiService);
  private readonly userMgmtService = inject(UserManagementService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal<KpiDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly lastRefresh = signal<Date | null>(null);
  readonly agents = signal<UserSummaryResponse[]>([]);
  readonly filters = signal<KpiFilters>({ periodDays: 30, agentId: null });

  private readonly refresh$ = new Subject<void>();

  ngOnInit(): void {
    this.userMgmtService.getMyAgents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (list) => this.agents.set(list), error: () => {} });

    this.refresh$.pipe(
      startWith(null),
      switchMap(() => {
        this.loading.set(true);
        this.error.set('');
        return this.kpiService.getDashboard(this.filters()).pipe(
          catchError(() => {
            this.error.set('Impossible de charger les KPIs. Vérifiez votre connexion.');
            this.loading.set(false);
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      this.data.set(data);
      this.loading.set(false);
      this.lastRefresh.set(new Date());
    });
  }

  onFiltersChange(filters: KpiFilters): void {
    this.filters.set(filters);
    this.refresh$.next();
  }

  refresh(): void {
    this.refresh$.next();
  }
}