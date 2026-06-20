import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserManagementService } from '../../../services/user-management.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  readonly pendingCount = signal(0);
  readonly loading = signal(true);

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit() {
    this.userManagementService.getPendingSuperAgents().subscribe({
      next: (superAgents) => {
        this.pendingCount.set(superAgents.length);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
