import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserManagementService } from '../../../../services/user-management.service';
import { UserSummaryResponse } from '../../../../models/user-management.models';

interface SuperAgentCard {
  user: UserSummaryResponse;
  loading: boolean;
  error: string;
  done: boolean;
}

@Component({
  selector: 'app-pending-super-agents',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pending-super-agents.html'
})
export class PendingSuperAgentsComponent implements OnInit {
  cards: SuperAgentCard[] = [];
  pageLoading = true;
  pageError = '';
  successMessage = '';

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit() {
    this.loadSuperAgents();
  }

  loadSuperAgents() {
    this.pageLoading = true;
    this.pageError = '';
    this.userManagementService.getPendingSuperAgents().subscribe({
      next: (users) => {
        this.cards = users.map(u => ({ user: u, loading: false, error: '', done: false }));
        this.pageLoading = false;
      },
      error: () => {
        this.pageError = 'Impossible de charger la liste. Veuillez réessayer.';
        this.pageLoading = false;
      }
    });
  }

  approve(card: SuperAgentCard) {
    card.loading = true;
    card.error = '';
    this.userManagementService.approveSuperAgent(card.user.id).subscribe({
      next: () => {
        card.loading = false;
        card.done = true;
        this.flash(`${card.user.prenom} ${card.user.nom} a été approuvé avec succès.`);
        setTimeout(() => this.removeCard(card), 1200);
      },
      error: (err) => {
        card.loading = false;
        card.error = err.error ?? 'Échec de l\'approbation.';
      }
    });
  }

  reject(card: SuperAgentCard) {
    card.loading = true;
    card.error = '';
    this.userManagementService.rejectSuperAgent(card.user.id).subscribe({
      next: () => {
        card.loading = false;
        card.done = true;
        this.flash(`${card.user.prenom} ${card.user.nom} a été rejeté.`);
        setTimeout(() => this.removeCard(card), 1200);
      },
      error: (err) => {
        card.loading = false;
        card.error = err.error ?? 'Échec du rejet.';
      }
    });
  }

  initials(card: SuperAgentCard): string {
    return `${card.user.prenom[0] ?? ''}${card.user.nom[0] ?? ''}`.toUpperCase();
  }

  private removeCard(card: SuperAgentCard) {
    this.cards = this.cards.filter(c => c !== card);
  }

  private flash(message: string) {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = ''), 4000);
  }
}
