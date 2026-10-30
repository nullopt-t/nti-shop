import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  readonly cartService = inject(CartService);

  name = '';
  phone = '';
  address = '';

  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completedOrder = signal<Order | null>(null);

  resetOutdatedBag(): void {
    this.cartService.clearCart();
    this.router.navigate(['/']);
  }

  submitOrder(): void {
    if (!this.name.trim() || !this.phone.trim() || !this.address.trim()) {
      this.errorMessage.set('Please provide your full name, phone number, and delivery address.');
      return;
    }

    if (this.cartService.items().length === 0) {
      this.errorMessage.set('Your cart is empty. Please add items before checking out.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      userDetails: {
        name: this.name.trim(),
        phone: this.phone.trim(),
        address: this.address.trim(),
      },
      items: this.cartService.items().map((entry) => ({
        itemId: entry.item._id,
        quantity: entry.quantity,
      })),
    };

    this.api.submitOrder(payload).subscribe({
      next: (res) => {
        this.completedOrder.set(res.data);
        this.cartService.clearCart();
        this.submitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message || 'Failed to submit order. Please check your network and try again.'
        );
        this.submitting.set(false);
      },
    });
  }
}
