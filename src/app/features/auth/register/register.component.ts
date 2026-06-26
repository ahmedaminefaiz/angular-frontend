import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../models/auth.models';
import { MoroccanPhoneInputComponent } from '../../../shared/phone-input/moroccan-phone-input.component';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoroccanPhoneInputComponent, ThemeToggleComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  readonly roles: Role[] = ['CITOYEN', 'AGENT', 'SUPER_AGENT'];

  form = new FormGroup({
    email: new FormControl('', [Validators.email]),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?:\+212|0)[67]\d{8}$/)
    ]),
    nom: new FormControl('', [Validators.required]),
    prenom: new FormControl('', [Validators.required]),
    dateNaissance: new FormControl('', [Validators.required]),
    ville: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    role: new FormControl<Role>('CITOYEN', [Validators.required]),
    supervisorId: new FormControl<number | null>(null)
  });

  readonly loading = signal(false);
  readonly error = signal('');

  get showSupervisorId(): boolean {
    const role = this.form.get('role')?.value;
    return role === 'AGENT' || role === 'SUPER_AGENT';
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const value = this.form.value;
    const payload: any = {
      email: value.email ?? '',
      phone: value.phone,
      nom: value.nom,
      prenom: value.prenom,
      dateNaissance: value.dateNaissance,
      ville: value.ville,
      password: value.password,
      role: value.role,
      ...(this.showSupervisorId && value.supervisorId
        ? { supervisorId: value.supervisorId }
        : {})
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/verify-phone'], {
          state: { phone: value.phone }
        });
      },
      error: (err) => {
        this.error.set(err.error ?? 'Inscription échouée');
        this.loading.set(false);
      }
    });
  }
}
