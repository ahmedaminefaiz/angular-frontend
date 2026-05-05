import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserManagementService } from '../../../services/user-management.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">

      <!-- Welcome banner -->
      <div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
        <h2 class="text-2xl font-bold mb-1">Espace Administrateur</h2>
        <p class="text-gray-300 text-sm">Supervisez la plateforme et gérez les comptes Super-Agent.</p>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- Pending super-agents -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-sm text-gray-500 mb-2">Super-Agents en attente</p>

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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
          </div>

          @if (!loading) {
            <div class="mt-4 pt-4 border-t border-gray-100">
              @if (pendingCount > 0) {
                <a
                  routerLink="/dashboard/admin/pending-super-agents"
                  class="inline-flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors">
                  Voir les super-agents en attente
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              } @else {
                <p class="text-sm text-gray-400">Aucun super-agent en attente.</p>
              }
            </div>
          }
        </div>

        <!-- Placeholder stats -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
          <p class="text-sm text-gray-500 mb-2">Utilisateurs actifs</p>
          <p class="text-4xl font-bold text-gray-300">—</p>
          <p class="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-400">
            Statistiques disponibles prochainement.
          </p>
        </div>

      </div>

      <!-- Activity placeholder -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 class="font-semibold text-gray-800 mb-4">Activité récente</h3>
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <p class="text-sm text-gray-400">L'historique des activités sera disponible prochainement.</p>
        </div>
      </div>

    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  pendingCount = 0;
  loading = true;

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit() {
    this.userManagementService.getPendingSuperAgents().subscribe({
      next: (superAgents) => {
        this.pendingCount = superAgents.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
