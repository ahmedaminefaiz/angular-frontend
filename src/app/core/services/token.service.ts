import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Role } from '../../models/auth.models';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly platformId = inject(PLATFORM_ID);

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  getRole(): Role | null {
    const payload = this.getTokenPayload();
    if (!payload) return null;

    const directRole = payload['role'];
    if (typeof directRole === 'string') {
      return this.normalizeRole(directRole);
    }

    const authorities = payload['authorities'] ?? payload['roles'];
    if (Array.isArray(authorities) && authorities.length > 0) {
      const first = String(authorities[0]);
      return this.normalizeRole(first);
    }

    return null;
  }

  private getTokenPayload(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      ) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private normalizeRole(value: string): Role | null {
    const normalized = value.replace(/^ROLE_/, '').toUpperCase();
    if (
      normalized === 'CITOYEN' ||
      normalized === 'AGENT' ||
      normalized === 'SUPER_AGENT' ||
      normalized === 'ADMIN'
    ) {
      return normalized;
    }
    return null;
  }

  getUserId(): number | null {
    const payload = this.getTokenPayload();
    if (!payload) return null;
    const candidate = payload['userId'] ?? payload['id'];
    const numeric = Number(candidate);
    return Number.isFinite(numeric) ? numeric : null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
