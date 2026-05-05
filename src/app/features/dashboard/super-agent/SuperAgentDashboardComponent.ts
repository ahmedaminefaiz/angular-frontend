import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserManagementService } from '../../../services/user-management.service';

@Component({
  selector: 'app-super-agent-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">

      <!-- Welcome banner -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <h2 class="text-2xl font-bold mb-1">Espace Super-Agent</h2>
        <p class="text-purple-100 text-sm">Gérez et approuvez les agents sous votre responsabilité.</p>
      </div>

      <!-- Pending agents card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm text-gray-500 mb-2">Agents en attente d'approbation</p>

            @if (loading) {
              <div class="h-10 w-16 bg-gray-100 rounded-lg animate-pulse"></div>
            } @else {
              <p class="text-4xl font-bold"
                [class.text-yellow-500]="pendingCount > 0"
                [class.text-gray-800]="pendingCount === 0">
                {{ pendingCount }}
              </p>
            }
          </div>
          <div class="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
        </div>

        @if (!loading) {
          <div class="mt-4 pt-4 border-t border-gray-100">
            @if (pendingCount > 0) {
              <a
                routerLink="/dashboard/super-agent/pending-agents"
                class="inline-flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors">
                Voir les agents en attente
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            } @else {
              <p class="text-sm text-gray-400">Aucun agent en attente. Tout est à jour.</p>
            }
          </div>
        }
      </div>

      <!-- Recent activity placeholder -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 class="font-semibold text-gray-800 mb-4">Historique des approbations</h3>
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <p class="text-sm text-gray-400">L'historique sera disponible prochainement.</p>
        </div>
      </div>

    </div>
  `
})
export class SuperAgentDashboardComponent implements OnInit {
  pendingCount = 0;
  loading = true;

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit() {
    this.userManagementService.getPendingAgents().subscribe({
      next: (agents) => {
        this.pendingCount = agents.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
