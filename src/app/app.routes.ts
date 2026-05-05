import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/LoginComponent';
import { RegisterComponent } from './pages/register/RegisterComponent';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {path: '', redirectTo: 'login', pathMatch: 'full'}
];
