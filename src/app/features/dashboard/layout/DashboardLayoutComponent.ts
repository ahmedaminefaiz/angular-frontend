import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TokenService } from '../../../core/services/token.service';
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
export class DashboardLayoutComponent implements OnInit {
  role: Role | null = null;
  navItems: NavItem[] = [];
  sidebarOpen = false;

  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit() {
    this.role = this.tokenService.getRole();
    this.navItems = this.buildNavItems(this.role);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
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
          { label: 'Tableau de bord', route: '/dashboard/citoyen' }
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
