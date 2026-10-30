import { Injectable, signal, computed } from '@angular/core';
import { Item, CartItem } from '../models/item.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'nti_cart_items_v1';

  readonly items = signal<CartItem[]>(this.loadFromStorage());

  readonly count = computed(() =>
    this.items().reduce((acc, curr) => acc + curr.quantity, 0)
  );

  readonly total = computed(() => {
    const sum = this.items().reduce(
      (acc, curr) => acc + curr.item.price * curr.quantity,
      0
    );
    return Math.round(sum * 100) / 100;
  });

  private loadFromStorage(): CartItem[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse cart from localStorage', e);
        }
      }
    }
    return [];
  }

  private saveToStorage(items: CartItem[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed saving cart to localStorage', e);
      }
    }
  }

  addItem(item: Item, quantity = 1): void {
    const current = this.items();
    const existingIndex = current.findIndex((i) => i.item._id === item._id);
    let updated: CartItem[];

    if (existingIndex > -1) {
      updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
    } else {
      updated = [...current, { item, quantity }];
    }

    this.items.set(updated);
    this.saveToStorage(updated);
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }
    const updated = this.items().map((entry) => {
      if (entry.item._id === itemId) {
        return { ...entry, quantity };
      }
      return entry;
    });
    this.items.set(updated);
    this.saveToStorage(updated);
  }

  removeItem(itemId: string): void {
    const updated = this.items().filter((entry) => entry.item._id !== itemId);
    this.items.set(updated);
    this.saveToStorage(updated);
  }

  clearCart(): void {
    this.items.set([]);
    this.saveToStorage([]);
  }
}
