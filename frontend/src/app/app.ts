import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CartService } from './core/services/cart.service';
import { FavoritesService } from './core/services/favorites.service';
import { AuthService } from './core/services/auth.service';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly router = inject(Router);
  readonly cartService = inject(CartService);
  readonly favoritesService = inject(FavoritesService);
  readonly authService = inject(AuthService);
  readonly langService = inject(LanguageService);

  readonly isManagerRoute = signal<boolean>(
    typeof window !== 'undefined' ? window.location.pathname.startsWith('/manager') : false
  );

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url;
        this.isManagerRoute.set(url.startsWith('/manager'));
      });
  }

  logoutManager(): void {
    this.authService.logout();
    this.router.navigate(['/manager/login']);
  }
}
