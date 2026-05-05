import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html'
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

  error = '';
  loading = false;

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
    this.loading = true;
    this.error = '';

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
        this.router.navigate(['/verify-phone'], {
          state: { phone: value.phone }
        });
      },
      error: (err) => {
        this.error = err.error ?? 'Inscription échouée';
        this.loading = false;
      }
    });
  }
}
