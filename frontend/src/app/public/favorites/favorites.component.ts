import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { Item } from '../../core/models/item.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent {
  readonly favoritesService = inject(FavoritesService);
  readonly cartService = inject(CartService);
  readonly langService = inject(LanguageService);

  addToCart(item: Item): void {
    this.cartService.addItem(item, 1);
  }

  remove(itemId: string): void {
    this.favoritesService.removeFavorite(itemId);
  }
}
