import { Component } from '@angular/core';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  template: `
    <div class="space-y-6">

      <!-- Welcome banner -->
      <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h2 class="text-2xl font-bold mb-1">Espace Agent</h2>
        <p class="text-indigo-100 text-sm">Consultez et gérez les dossiers qui vous sont assignés.</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3 md:gap-4">
        <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 text-center">
          <p class="text-2xl md:text-3xl font-bold text-gray-800">0</p>
          <p class="text-xs md:text-sm text-gray-500 mt-1">Dossiers assignés</p>
        </div>
        <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 text-center">
          <p class="text-2xl md:text-3xl font-bold text-green-500">0</p>
          <p class="text-xs md:text-sm text-gray-500 mt-1">Traités aujourd'hui</p>
        </div>
      </div>

      <!-- Status banner -->
      <div class="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <div class="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></div>
        <p class="text-sm text-green-800 font-medium">Votre compte est actif. Vous pouvez traiter des dossiers.</p>
      </div>

      <!-- Dossiers section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 class="font-semibold text-gray-800 mb-6">Dossiers assignés</h3>

        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center py-10 text-center">
          <div class="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <p class="text-gray-600 font-medium mb-1">Aucun dossier pour l'instant</p>
          <p class="text-sm text-gray-400 max-w-xs">Les dossiers vous seront assignés par votre superviseur.</p>
        </div>
      </div>

    </div>
  `
})
export class AgentDashboardComponent {}
