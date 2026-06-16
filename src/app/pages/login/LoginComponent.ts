import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { Role } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {
  form = new FormGroup({
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?:\+212|0)[67]\d{8}$/)
    ]),
    password: new FormControl('', [Validators.required])
  });

  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.value as any).subscribe({
      next: (response) => {
        const token = typeof response === 'string' ? response : response?.token;
        if (!token) {
          this.error = 'Réponse de connexion invalide (token manquant).';
          this.loading = false;
          return;
        }

        this.tokenService.setToken(token);
        const role =
          (typeof response === 'object' && response?.role
            ? response.role
            : this.tokenService.getRole()) ?? null;

        if (!role) {
          this.error = 'Impossible de déterminer le rôle utilisateur.';
          this.loading = false;
          return;
        }

        this.router.navigate([this.dashboardRoute(role)]);
      },
      error: (err) => {
        if (err.status === 0) {
          this.error = 'Impossible de joindre le serveur (CORS ou backend arrêté).';
        } else if (err.status === 401) {
          this.error = 'Numéro de téléphone ou mot de passe incorrect';
        } else {
          this.error =
            typeof err.error === 'string'
              ? err.error
              : 'Compte non actif ou erreur de connexion';
        }
        this.loading = false;
      }
    });
  }

  private dashboardRoute(role: Role): string {
    const routes: Record<Role, string> = {
      CITOYEN: '/dashboard/citoyen/alerts',
      AGENT: '/dashboard/agent',
      SUPER_AGENT: '/dashboard/super-agent',
      ADMIN: '/dashboard/admin'
    };
    return routes[role];
  }
}
