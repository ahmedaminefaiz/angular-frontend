import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

/**
 * Resolves and persists the active color theme.
 *
 * Default behaviour follows the OS (`prefers-color-scheme`). Once the user
 * picks a theme explicitly it is stored in localStorage and OS changes are
 * ignored until they reset to system via {@link useSystem}.
 *
 * The initial value is also applied in an inline script in index.html so the
 * server-rendered page paints in the right theme before Angular hydrates; this
 * service simply keeps things in sync afterwards.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly storageKey = 'theme';

  /** The currently applied theme. */
  readonly theme = signal<Theme>('dark');

  /** True when the theme is following the OS setting (no explicit user choice). */
  readonly followsSystem = signal<boolean>(true);

  private mediaQuery?: MediaQueryList;

  constructor() {
    if (!this.isBrowser) return;

    const saved = this.readSaved();
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

    const initial: Theme = saved ?? (this.mediaQuery.matches ? 'light' : 'dark');
    this.followsSystem.set(saved === null);
    this.theme.set(initial);
    this.apply(initial);

    // Track OS changes while the user hasn't made an explicit choice.
    this.mediaQuery.addEventListener('change', (e) => {
      if (!this.followsSystem()) return;
      const next: Theme = e.matches ? 'light' : 'dark';
      this.theme.set(next);
      this.apply(next);
    });
  }

  /** Flip between light and dark (becomes an explicit user choice). */
  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  /** Set an explicit theme and remember it. */
  set(theme: Theme): void {
    this.theme.set(theme);
    if (!this.isBrowser) return;
    localStorage.setItem(this.storageKey, theme);
    this.followsSystem.set(false);
    this.apply(theme);
  }

  /** Stop overriding and follow the OS setting again. */
  useSystem(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.storageKey);
    this.followsSystem.set(true);
    const next: Theme = this.mediaQuery?.matches ? 'light' : 'dark';
    this.theme.set(next);
    this.apply(next);
  }

  private readSaved(): Theme | null {
    const value = localStorage.getItem(this.storageKey);
    return value === 'light' || value === 'dark' ? value : null;
  }

  private apply(theme: Theme): void {
    if (!this.isBrowser) return;
    document.documentElement.setAttribute('data-theme', theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f4f1ea' : '#0b0c0e');
  }
}
