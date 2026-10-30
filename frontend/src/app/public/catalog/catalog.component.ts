import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { Item } from '../../core/models/item.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private api = inject(ApiService);
  readonly cartService = inject(CartService);
  readonly favoritesService = inject(FavoritesService);

  readonly categories = signal<string[]>([]);
  readonly items = signal<Item[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCategories();
    this.loadItems();
  }

  loadCategories(): void {
    this.api.getPublicCategories().subscribe({
      next: (res) => this.categories.set(res.data),
      error: (err) => console.error('Failed loading categories', err),
    });
  }

  loadItems(category?: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedCategory.set(category || null);

    this.api.getPublicItems(category).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load catalog items from server.');
        this.loading.set(false);
      },
    });
  }

  filterByCategory(category: string | null): void {
    this.loadItems(category || undefined);
  }

  onCategoryDropdownChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value ? select.value : null;
    this.filterByCategory(value);
  }

  onAddToCart(item: Item, event: Event): void {
    event.stopPropagation();
    this.cartService.addItem(item, 1);
  }

  onToggleFavorite(item: Item, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggleFavorite(item);
  }
}
