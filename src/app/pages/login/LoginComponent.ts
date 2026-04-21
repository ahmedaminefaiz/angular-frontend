import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../services/api';
import { LoginRequest } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {

  // The form definition: each field is a FormControl with its validation rules
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  // Will hold the response message to display to the user
  message = '';

  // Angular injects the Api service automatically via the constructor
  constructor(private api: Api) {}

  onSubmit() {
    // If any field is invalid, stop here — don't send the request
    if (this.form.invalid) return;

    // Cast the form value to LoginRequest so TypeScript knows its shape
    const credentials = this.form.value as LoginRequest;

    this.api.login(credentials).subscribe({
      next: (msg) => this.message = msg,
      error: () => this.message = 'Invalid email or password'
    });
  }
}
