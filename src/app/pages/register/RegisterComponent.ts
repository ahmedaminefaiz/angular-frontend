import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../services/api';
import { SignupRequest } from '../../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html'
})
export class RegisterComponent {

  // The form definition: each field is a FormControl with its validation rules
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    nom: new FormControl('', [Validators.required]),
    prenom: new FormControl('', [Validators.required]),
    dateNaissance: new FormControl('', [Validators.required]),
    ville: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  // Will hold the response message to display to the user
  message = '';

  // Angular injects the Api service automatically via the constructor
  constructor(private api: Api) {}

  onSubmit() {
    // If any field is invalid, stop here — don't send the request
    if (this.form.invalid) return;

    // Cast the form value to SignupRequest so TypeScript knows its shape
    const userData = this.form.value as SignupRequest;

    this.api.signup(userData).subscribe({
      next: (msg) => this.message = msg,
      error: () => this.message = 'Registration failed'
    });
  }
}
