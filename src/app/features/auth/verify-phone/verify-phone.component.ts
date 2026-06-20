import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MoroccanPhoneInputComponent } from '../../../shared/phone-input/moroccan-phone-input.component';

@Component({
  selector: 'app-verify-phone',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoroccanPhoneInputComponent],
  templateUrl: './verify-phone.component.html'
})
export class VerifyPhoneComponent implements OnInit {
  phone = '';

  readonly loading = signal(false);
  readonly error = signal('');

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
    this.loading.set(true);
    this.error.set('');

    this.authService.verifyPhone(this.form.value as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login'], {
          state: { verifiedMessage: 'Numéro vérifié avec succès. Connectez-vous pour accéder à votre espace.' }
        });
      },
      error: (err) => {
        this.error.set(err.error ?? 'Code invalide ou expiré');
        this.loading.set(false);
      }
    });
  }
}
