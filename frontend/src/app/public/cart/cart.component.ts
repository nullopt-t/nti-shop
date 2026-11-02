import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  readonly cartService = inject(CartService);
  readonly langService = inject(LanguageService);

  increase(itemId: string, currentQty: number): void {
    this.cartService.updateQuantity(itemId, currentQty + 1);
  }

  decrease(itemId: string, currentQty: number): void {
    this.cartService.updateQuantity(itemId, currentQty - 1);
  }

  remove(itemId: string): void {
    this.cartService.removeItem(itemId);
  }

  clear(): void {
    this.cartService.clearCart();
  }
}
