import { Component } from '@angular/core';

@Component({
  selector: 'app-citoyen-dashboard',
  standalone: true,
  template: `
    <div class="space-y-6">

      <!-- Welcome banner -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h2 class="text-2xl font-bold mb-1">Bienvenue</h2>
        <p class="text-blue-100 text-sm">Gérez vos demandes administratives en toute simplicité.</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3 md:gap-4">
        <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 text-center">
          <p class="text-2xl md:text-3xl font-bold text-gray-800">0</p>
          <p class="text-xs md:text-sm text-gray-500 mt-1">Total</p>
        </div>
        <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 text-center">
          <p class="text-2xl md:text-3xl font-bold text-yellow-500">0</p>
          <p class="text-xs md:text-sm text-gray-500 mt-1">En cours</p>
        </div>
        <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 text-center">
          <p class="text-2xl md:text-3xl font-bold text-green-500">0</p>
          <p class="text-xs md:text-sm text-gray-500 mt-1">Résolues</p>
        </div>
      </div>

      <!-- Requests card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-semibold text-gray-800">Mes demandes</h3>
          <div class="relative">
            <button disabled
              class="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">
              + Nouvelle
            </button>
            <span class="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none">
              Bientôt
            </span>
          </div>
        </div>

        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center py-10 text-center">
          <div class="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p class="text-gray-600 font-medium mb-1">Aucune demande pour l'instant</p>
          <p class="text-sm text-gray-400 max-w-xs">La soumission de demandes sera disponible très prochainement.</p>
        </div>
      </div>

    </div>
  `
})
export class CitoyenDashboardComponent {}
