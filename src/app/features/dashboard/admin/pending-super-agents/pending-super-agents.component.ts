import { Component, OnInit, signal } from '@angular/core';
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
  templateUrl: './pending-super-agents.component.html'
})
export class PendingSuperAgentsComponent implements OnInit {
  readonly cards = signal<SuperAgentCard[]>([]);
  readonly pageLoading = signal(true);
  readonly pageError = signal('');
  readonly successMessage = signal('');

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit() {
    this.loadSuperAgents();
  }

  loadSuperAgents() {
    this.pageLoading.set(true);
    this.pageError.set('');
    this.userManagementService.getPendingSuperAgents().subscribe({
      next: (users) => {
        this.cards.set(users.map(u => ({ user: u, loading: false, error: '', done: false })));
        this.pageLoading.set(false);
      },
      error: () => {
        this.pageError.set('Impossible de charger la liste. Veuillez réessayer.');
        this.pageLoading.set(false);
      }
    });
  }

  approve(card: SuperAgentCard) {
    this.cards.update(arr => arr.map(c => c.user.id === card.user.id ? { ...c, loading: true, error: '' } : c));
    this.userManagementService.approveSuperAgent(card.user.id).subscribe({
      next: () => {
        this.cards.update(arr => arr.map(c => c.user.id === card.user.id ? { ...c, loading: false, done: true } : c));
        this.flash(`${card.user.prenom} ${card.user.nom} a été approuvé avec succès.`);
        setTimeout(() => this.removeCard(card.user.id), 1200);
      },
      error: (err) => {
        this.cards.update(arr => arr.map(c => c.user.id === card.user.id
          ? { ...c, loading: false, error: err.error ?? "Échec de l'approbation." }
          : c));
      }
    });
  }

  reject(card: SuperAgentCard) {
    this.cards.update(arr => arr.map(c => c.user.id === card.user.id ? { ...c, loading: true, error: '' } : c));
    this.userManagementService.rejectSuperAgent(card.user.id).subscribe({
      next: () => {
        this.cards.update(arr => arr.map(c => c.user.id === card.user.id ? { ...c, loading: false, done: true } : c));
        this.flash(`${card.user.prenom} ${card.user.nom} a été rejeté.`);
        setTimeout(() => this.removeCard(card.user.id), 1200);
      },
      error: (err) => {
        this.cards.update(arr => arr.map(c => c.user.id === card.user.id
          ? { ...c, loading: false, error: err.error ?? "Échec du rejet." }
          : c));
      }
    });
  }

  initials(card: SuperAgentCard): string {
    return `${card.user.prenom[0] ?? ''}${card.user.nom[0] ?? ''}`.toUpperCase();
  }

  private removeCard(userId: number) {
    this.cards.update(arr => arr.filter(c => c.user.id !== userId));
  }

  private flash(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 4000);
  }
}
