import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { Order, CreateOrderPayload } from '../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly cartService = inject(CartService);

  paymentMethod: 'cod' | 'paymob' = 'cod';
  name = '';
  phone = '';
  address = '';

  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completedOrder = signal<Order | null>(null);
  readonly paymobReturnNotice = signal<string | null>(null);

  ngOnInit(): void {
    // Check if returning from Paymob Unified Checkout redirect
    const params = this.route.snapshot.queryParams;
    if (params['orderId']) {
      const isSuccess = params['success'] === 'true' || !params['success'];
      if (isSuccess) {
        this.paymobReturnNotice.set(
          `Thank you! Your payment for order #${params['orderId']} has been recorded. Our team will verify and prepare your dispatch.`
        );
        this.cartService.clearCart();
      } else {
        this.errorMessage.set('Payment could not be completed via the gateway. Please try again.');
      }
    }
  }

  setPaymentMethod(method: 'cod' | 'paymob'): void {
    this.paymentMethod = method;
    this.errorMessage.set(null);
  }

  resetOutdatedBag(): void {
    this.cartService.clearCart();
    this.router.navigate(['/']);
  }

  submitOrder(): void {
    if (this.cartService.items().length === 0) {
      this.errorMessage.set('Your cart is empty. Please add items before checking out.');
      return;
    }

    // Cash on Delivery requires full contact details
    if (this.paymentMethod === 'cod') {
      if (!this.name.trim() || !this.phone.trim() || !this.address.trim()) {
        this.errorMessage.set('Please provide your full name, phone number, and delivery address for Cash on Delivery.');
        return;
      }
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const payload: CreateOrderPayload = {
      paymentMethod: this.paymentMethod,
      userDetails: {
        name: this.name.trim() || 'Guest Customer',
        phone: this.phone.trim() || 'N/A',
        address: this.address.trim() || 'N/A',
      },
      items: this.cartService.items().map((entry) => ({
        itemId: entry.item._id,
        quantity: entry.quantity,
      })),
    };

    this.api.submitOrder(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);

        if (this.paymentMethod === 'paymob' && res.checkoutUrl) {
          this.cartService.clearCart();
          // Redirect browser directly to Paymob Unified Checkout
          window.location.href = res.checkoutUrl;
          return;
        }

        this.completedOrder.set(res.data);
        this.cartService.clearCart();
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
