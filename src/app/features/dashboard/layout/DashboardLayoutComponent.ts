import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { TokenService } from '../../../core/services/token.service';
import { NotificationService } from '../../../services/notification.service';
import { Role } from '../../../models/auth.models';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
  templateUrl: './dashboard-layout.html'
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  role: Role | null = null;
  navItems: NavItem[] = [];
  sidebarOpen = false;
  unreadCount = 0;

  private layoutSub: Subscription | null = null;

  constructor(
    private tokenService: TokenService,
    private router: Router,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.role = this.tokenService.getRole();
    this.navItems = this.buildNavItems(this.role);

    if (this.role === 'CITOYEN') {
      const token = this.tokenService.getToken();
      if (token) {
        this.notificationService.initForUser();
        this.notificationService.connect(token);
      }
      this.layoutSub = this.notificationService.unreadCount$.subscribe(n => {
        this.unreadCount = n;
      });
    }
  }

  ngOnDestroy(): void {
    this.notificationService.disconnect();
    this.layoutSub?.unsubscribe();
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
          { label: 'Alerts', route: '/dashboard/citoyen/alerts' },
          { label: 'My Alerts', route: '/dashboard/citoyen/my-alerts' },
          { label: 'Approved Alerts', route: '/dashboard/citoyen/approved-alerts' },
          { label: 'Notifications', route: '/dashboard/citoyen/notifications' }
        ];
      case 'AGENT':
        return [
          { label: 'Tableau de bord', route: '/dashboard/agent' }
        ];
      case 'SUPER_AGENT':
        return [
          { label: 'Tableau de bord', route: '/dashboard/super-agent' },
          { label: 'Agents en attente', route: '/dashboard/super-agent/pending-agents' }
        ];
      case 'ADMIN':
        return [
          { label: 'Tableau de bord', route: '/dashboard/admin' },
          { label: 'Super-Agents en attente', route: '/dashboard/admin/pending-super-agents' }
        ];
      default:
        return [];
    }
  }
}