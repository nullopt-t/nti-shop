import { Injectable, signal, computed } from '@angular/core';
import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'nti_favorites_items_v1';

  readonly favorites = signal<Item[]>(this.loadFromStorage());

  readonly count = computed(() => this.favorites().length);

  private loadFromStorage(): Item[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse favorites from localStorage', e);
        }
      }
    }
    return [];
  }

  private saveToStorage(favs: Item[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favs));
      } catch (e) {
        console.error('Failed saving favorites to localStorage', e);
      }
    }
  }

  getItemLocalizedName(item: Item, lang: string): string {
    if (lang !== 'en' && item.translations?.[lang]?.name) {
      return item.translations[lang].name!;
    }
    return item.name;
  }

  getItemLocalizedDescription(item: Item, lang: string): string {
    if (lang !== 'en' && item.translations?.[lang]?.description) {
      return item.translations[lang].description!;
    }
    return item.description;
  }

  isFavorite(itemId: string): boolean {
    return this.favorites().some((i) => i._id === itemId);
  }

  toggleFavorite(item: Item): void {
    const exists = this.isFavorite(item._id);
    let updated: Item[];
    if (exists) {
      updated = this.favorites().filter((i) => i._id !== item._id);
    } else {
      updated = [...this.favorites(), item];
    }
    this.favorites.set(updated);
    this.saveToStorage(updated);
  }

  removeFavorite(itemId: string): void {
    const updated = this.favorites().filter((i) => i._id !== itemId);
    this.favorites.set(updated);
    this.saveToStorage(updated);
  }
}
