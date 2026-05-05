import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/LoginComponent';
import { RegisterComponent } from './pages/register/RegisterComponent';
import { VerifyPhoneComponent } from './pages/verify-phone/VerifyPhoneComponent';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-phone', component: VerifyPhoneComponent },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/layout/DashboardLayoutComponent').then(
        m => m.DashboardLayoutComponent
      ),
    children: [
      {
        path: 'citoyen',
        canActivate: [roleGuard],
        data: { roles: ['CITOYEN'] },
        loadComponent: () =>
          import('./features/dashboard/citoyen/CitoyenDashboardComponent').then(
            m => m.CitoyenDashboardComponent
          )
      },
      {
        path: 'agent',
        canActivate: [roleGuard],
        data: { roles: ['AGENT'] },
        loadComponent: () =>
          import('./features/dashboard/agent/AgentDashboardComponent').then(
            m => m.AgentDashboardComponent
          )
      },
      {
        path: 'super-agent',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_AGENT'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/dashboard/super-agent/SuperAgentDashboardComponent').then(
                m => m.SuperAgentDashboardComponent
              )
          },
          {
            path: 'pending-agents',
            loadComponent: () =>
              import('./features/dashboard/super-agent/pending-agents/PendingAgentsComponent').then(
                m => m.PendingAgentsComponent
              )
          }
        ]
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/dashboard/admin/AdminDashboardComponent').then(
                m => m.AdminDashboardComponent
              )
          },
          {
            path: 'pending-super-agents',
            loadComponent: () =>
              import('./features/dashboard/admin/pending-super-agents/PendingSuperAgentsComponent').then(
                m => m.PendingSuperAgentsComponent
              )
          }
        ]
      }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
