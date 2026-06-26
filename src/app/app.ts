import { RouterOutlet } from '@angular/router';
import { Component, inject } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App {
  // Instantiated at the root so the theme is resolved and OS changes are
  // tracked app-wide, regardless of which route renders first.
  private readonly theme = inject(ThemeService);
}
