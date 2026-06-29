import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { TokenService } from '../../../core/services/token.service';
import { NotificationService } from '../../../services/notification.service';
import { NotificationResponse } from '../../../models/notification.models';
import { Role } from '../../../models/auth.models';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, ThemeToggleComponent],
  templateUrl: './dashboard-layout.component.html'
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  role: Role | null = null;
  fullName: string | null = null;
  navItems: NavItem[] = [];
  sidebarOpen = false;
  unreadCount = 0;
  toast: NotificationResponse | null = null;

  private layoutSub: Subscription | null = null;
  private toastSub: Subscription | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private tokenService: TokenService,
    private router: Router,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.role = this.tokenService.getRole();
    this.fullName = this.tokenService.getFullName();
    this.navItems = this.buildNavItems(this.role);

    if (this.role === 'CITOYEN' || this.role === 'AGENT') {
      const token = this.tokenService.getToken();
      if (token) {
        this.notificationService.initForUser();
        this.notificationService.connect(token);
      }
      this.layoutSub = this.notificationService.unreadCount$.subscribe(n => {
        this.unreadCount = n;
      });
      this.toastSub = this.notificationService.live$.subscribe(notif => {
        this.toast = notif;
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => { this.toast = null; }, 5000);
      });
    }
  }

  ngOnDestroy(): void {
    this.notificationService.disconnect();
    this.layoutSub?.unsubscribe();
    this.toastSub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  dismissToast(): void {
    this.toast = null;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.notificationService.disconnect();
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }

  isNotifRoute(item: NavItem): boolean {
    return item.route.includes('notifications');
  }

  get displayName(): string {
    return this.fullName ?? this.roleLabel;
  }

  get roleLabel(): string {
    const labels: Record<string, string> = {
      CITOYEN: 'Citoyen',
      AGENT: 'Agent',
      SUPER_AGENT: 'Super-Agent',
      ADMIN: 'Administrateur'
    };
    return this.role ? (labels[this.role] ?? this.role) : '';
  }

  private buildNavItems(role: Role | null): NavItem[] {
    switch (role) {
      case 'CITOYEN':
        return [

          { label: 'Signalements', route: '/dashboard/citoyen/alerts' },
          { label: 'Mes signalements', route: '/dashboard/citoyen/my-alerts' },
          { label: 'Signalements approuvés', route: '/dashboard/citoyen/approved-alerts' },
          { label: 'Notifications', route: '/dashboard/citoyen/notifications' }
        ];
      case 'AGENT':
        return [
          { label: 'Tableau de bord', route: '/dashboard/agent' },
          { label: 'Mes interventions', route: '/dashboard/agent/interventions' },
          { label: 'Notifications', route: '/dashboard/agent/notifications' }
        ];
      case 'SUPER_AGENT':
        return [
          { label: 'Tableau de bord', route: '/dashboard/super-agent' },
          { label: 'KPIs & Performance', route: '/dashboard/super-agent/kpi' },
          { label: 'Agents en attente', route: '/dashboard/super-agent/pending-agents' },
          { label: 'Signalements à qualifier', route: '/dashboard/super-agent/alerts' },
          { label: 'Mes problèmes', route: '/dashboard/super-agent/problems' }
        ];
      case 'ADMIN':
        return [
          { label: 'Tableau de bord', route: '/dashboard/admin' },
          { label: 'Super-Agents en attente', route: '/dashboard/admin/pending-super-agents' },
          { label: 'Types de problèmes', route: '/dashboard/admin/problem-types' }
        ];
      default:
        return [];
    }
  }
}