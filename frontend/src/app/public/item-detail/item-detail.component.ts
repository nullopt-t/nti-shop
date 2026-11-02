import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { LanguageService } from '../../core/services/language.service';
import { Item } from '../../core/models/item.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './item-detail.component.html',
  styleUrl: './item-detail.component.scss',
})
export class ItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  readonly cartService = inject(CartService);
  readonly favoritesService = inject(FavoritesService);
  readonly langService = inject(LanguageService);

  readonly item = signal<Item | null>(null);
  readonly quantity = signal<number>(1);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly addedNotification = signal<boolean>(false);

  private currentItemId: string | null = null;

  constructor() {
    effect(() => {
      this.langService.currentLanguage();
      if (this.currentItemId) {
        this.loadItem(this.currentItemId);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }
    this.currentItemId = id;
    this.loadItem(id);
  }

  loadItem(id: string): void {
    this.loading.set(true);
    this.api.getPublicItemById(id).subscribe({
      next: (res) => {
        this.item.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Item not found or failed to load details.');
        this.loading.set(false);
      },
    });
  }

  increaseQty(): void {
    this.quantity.update((q) => q + 1);
  }

  decreaseQty(): void {
    this.quantity.update((q) => (q > 1 ? q - 1 : 1));
  }

  addToCart(): void {
    const itm = this.item();
    if (!itm) return;
    this.cartService.addItem(itm, this.quantity());
    this.addedNotification.set(true);
    setTimeout(() => this.addedNotification.set(false), 2500);
  }

  toggleFavorite(): void {
    const itm = this.item();
    if (itm) {
      this.favoritesService.toggleFavorite(itm);
    }
  }
}
