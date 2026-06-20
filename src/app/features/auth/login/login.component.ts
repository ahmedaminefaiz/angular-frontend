import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { Role } from '../../../models/auth.models';
import { MoroccanPhoneInputComponent } from '../../../shared/phone-input/moroccan-phone-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoroccanPhoneInputComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  form = new FormGroup({
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?:\+212|0)[67]\d{8}$/)
    ]),
    password: new FormControl('', [Validators.required])
  });

  readonly loading = signal(false);
  readonly error = signal('');
  readonly verifiedMessage = signal('');

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state?.['verifiedMessage']) {
      this.verifiedMessage.set(state['verifiedMessage']);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.form.value as any).subscribe({
      next: (response) => {
        const token = typeof response === 'string' ? response : response?.token;
        if (!token) {
          this.error.set('Réponse de connexion invalide (token manquant).');
          this.loading.set(false);
          return;
        }

        this.tokenService.setToken(token);
        const role =
          (typeof response === 'object' && response?.role
            ? response.role
            : this.tokenService.getRole()) ?? null;

        if (!role) {
          this.error.set('Impossible de déterminer le rôle utilisateur.');
          this.loading.set(false);
          return;
        }

        this.loading.set(false);
        this.router.navigate([this.dashboardRoute(role)]);
      },
      error: (err) => {
        if (err.status === 0) {
          this.error.set('Impossible de joindre le serveur (CORS ou backend arrêté).');
        } else if (err.status === 401) {
          this.error.set('Numéro de téléphone ou mot de passe incorrect.');
        } else {
          this.error.set(
            typeof err.error === 'string' ? err.error : 'Compte non actif ou erreur de connexion.'
          );
        }
        this.loading.set(false);
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
