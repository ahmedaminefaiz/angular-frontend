import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { Role } from '../../models/auth.models';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const allowedRoles: Role[] = route.data['roles'] ?? [];
  const userRole = tokenService.getRole();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  const dashboardRoutes: Record<Role, string> = {
    CITOYEN: '/dashboard/citoyen',
    AGENT: '/dashboard/agent',
    SUPER_AGENT: '/dashboard/super-agent',
    ADMIN: '/dashboard/admin'
  };

  if (userRole && dashboardRoutes[userRole]) {
    return router.createUrlTree([dashboardRoutes[userRole]]);
  }

  return router.createUrlTree(['/login']);
};
