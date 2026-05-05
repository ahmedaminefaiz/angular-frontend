import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { Role } from '../../models/auth.models';

@Component({
  selector: 'app-verify-phone',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-phone.html'
})
export class VerifyPhoneComponent implements OnInit {
  phone = '';
  pendingMessage = '';
  error = '';
  loading = false;

  form = new FormGroup({
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?:\+212|0)[67]\d{8}$/)
    ]),
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6)
    ])
  });

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit() {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state?.['phone']) {
      this.phone = state['phone'];
      this.form.get('phone')?.setValue(this.phone);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.pendingMessage = '';

    this.authService.verifyPhone(this.form.value as any).subscribe({
      next: (response) => {
        if (response.status === 200 && response.body?.token) {
          this.tokenService.setToken(response.body.token);
          this.router.navigate([this.dashboardRoute(response.body.role)]);
        } else {
          this.pendingMessage = 'Téléphone vérifié. Votre compte est en attente d\'approbation.';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.error ?? 'Code invalide ou expiré';
        this.loading = false;
      }
    });
  }

  private dashboardRoute(role: Role): string {
    const routes: Record<Role, string> = {
      CITOYEN: '/dashboard/citoyen',
      AGENT: '/dashboard/agent',
      SUPER_AGENT: '/dashboard/super-agent',
      ADMIN: '/dashboard/admin'
    };
    return routes[role];
  }
}
