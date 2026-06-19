import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserManagementService } from '../../../services/user-management.service';

@Component({
  selector: 'app-super-agent-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './super-agent-dashboard.component.html'
})
export class SuperAgentDashboardComponent implements OnInit {
  readonly pendingCount = signal(0);
  readonly loading = signal(true);

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit() {
    this.userManagementService.getPendingAgents().subscribe({
      next: (agents) => {
        this.pendingCount.set(agents.length);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
