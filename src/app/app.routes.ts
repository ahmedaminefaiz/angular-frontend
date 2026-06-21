import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { VerifyPhoneComponent } from './features/auth/verify-phone/verify-phone.component';
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
      import('./features/dashboard/layout/dashboard-layout.component').then(
        m => m.DashboardLayoutComponent
      ),
    children: [
      { path: 'citoyen', redirectTo: 'citoyen/alerts', pathMatch: 'full' },
      {
        path: 'citoyen/:tab',
        canActivate: [roleGuard],
        data: { roles: ['CITOYEN'] },
        loadComponent: () =>
          import('./features/dashboard/citoyen/citoyen-dashboard.component').then(
            m => m.CitoyenDashboardComponent
          )
      },
      {
        path: 'agent',
        canActivate: [roleGuard],
        data: { roles: ['AGENT'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/dashboard/agent/agent-dashboard.component').then(
                m => m.AgentDashboardComponent
              )
          },
          {
            path: 'problems',
            loadComponent: () =>
              import('./features/dashboard/agent/problems/agent-problems.component').then(
                m => m.AgentProblemsComponent
              )
          }
        ]
      },
      {
        path: 'super-agent',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_AGENT'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/dashboard/super-agent/super-agent-dashboard.component').then(
                m => m.SuperAgentDashboardComponent
              )
          },
          {
            path: 'pending-agents',
            loadComponent: () =>
              import('./features/dashboard/super-agent/pending-agents/pending-agents.component').then(
                m => m.PendingAgentsComponent
              )
          },
          {
            path: 'alerts',
            loadComponent: () =>
              import('./features/dashboard/super-agent/alerts/super-agent-alerts.component').then(
                m => m.SuperAgentAlertsComponent
              )
          },
          {
            path: 'problems',
            loadComponent: () =>
              import('./features/dashboard/super-agent/problems/super-agent-problems.component').then(
                m => m.SuperAgentProblemsComponent
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
              import('./features/dashboard/admin/admin-dashboard.component').then(
                m => m.AdminDashboardComponent
              )
          },
          {
            path: 'pending-super-agents',
            loadComponent: () =>
              import('./features/dashboard/admin/pending-super-agents/pending-super-agents.component').then(
                m => m.PendingSuperAgentsComponent
              )
          },
          {
            path: 'problem-types',
            loadComponent: () =>
              import('./features/dashboard/admin/problem-types/admin-problem-types.component').then(
                m => m.AdminProblemTypesComponent
              )
          }
        ]
      }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
