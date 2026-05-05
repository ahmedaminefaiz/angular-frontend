import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserManagementService } from '../../../../services/user-management.service';
import { UserSummaryResponse } from '../../../../models/user-management.models';

interface AgentCard {
  user: UserSummaryResponse;
  loading: boolean;
  error: string;
  done: boolean;
}

@Component({
  selector: 'app-pending-agents',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pending-agents.html'
})
export class PendingAgentsComponent implements OnInit {
  cards: AgentCard[] = [];
  pageLoading = true;
  pageError = '';
  successMessage = '';

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit() {
    this.loadAgents();
  }

  loadAgents() {
    this.pageLoading = true;
    this.pageError = '';
    this.userManagementService.getPendingAgents().subscribe({
      next: (agents) => {
        this.cards = agents.map(u => ({ user: u, loading: false, error: '', done: false }));
        this.pageLoading = false;
      },
      error: () => {
        this.pageError = 'Impossible de charger la liste. Veuillez réessayer.';
        this.pageLoading = false;
      }
    });
  }

  approve(card: AgentCard) {
    card.loading = true;
    card.error = '';
    this.userManagementService.approveAgent(card.user.id).subscribe({
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

  reject(card: AgentCard) {
    card.loading = true;
    card.error = '';
    this.userManagementService.rejectAgent(card.user.id).subscribe({
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

  initials(card: AgentCard): string {
    return `${card.user.prenom[0] ?? ''}${card.user.nom[0] ?? ''}`.toUpperCase();
  }

  private removeCard(card: AgentCard) {
    this.cards = this.cards.filter(c => c !== card);
  }

  private flash(message: string) {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = ''), 4000);
  }
}
