import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Compact icon button that flips between light and dark.
 * Shows the icon of the theme it will switch *to*.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      [attr.aria-label]="theme.theme() === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'"
      [title]="theme.theme() === 'dark' ? 'Mode clair' : 'Mode sombre'"
      (click)="theme.toggle()">
      @if (theme.theme() === 'dark') {
        <!-- sun -->
        <svg class="h-[1.05rem] w-[1.05rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" stroke-width="2" />
          <path stroke-linecap="round" stroke-width="2"
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      } @else {
        <!-- moon -->
        <svg class="h-[1.05rem] w-[1.05rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      }
    </button>
  `
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
