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
    const orderId = params['orderId'];

    if (orderId) {
      const isSuccessParam = params['success'] === 'true';
      const isPendingParam = params['pending'] === 'true';
      const isFailedParam = params['success'] === 'false';

      if (isFailedParam) {
        this.errorMessage.set('Payment was declined or cancelled at the gateway. Please retry or choose Cash on Delivery.');
        return;
      }

      // Verify source-of-truth status from server database
      this.api.getOrderStatus(orderId).subscribe({
        next: (res) => {
          this.cartService.clearCart();
          const ord = res.data;

          if (ord.paymentStatus === 'paid' || isSuccessParam) {
            this.paymobReturnNotice.set(
              `Payment confirmed for order #${ord._id}. Total settled: $${ord.totalPrice.toFixed(2)}. Our team is preparing your dispatch.`
            );
          } else if (ord.paymentStatus === 'pending' || isPendingParam) {
            this.paymobReturnNotice.set(
              `Your payment for order #${ord._id} is being processed by the bank. We will update you once confirmed.`
            );
          } else {
            this.errorMessage.set(
              `Payment for order #${ord._id} could not be settled. Status: ${ord.paymentStatus}.`
            );
          }
        },
        error: () => {
          // Fallback to query parameters if offline
          if (isSuccessParam) {
            this.cartService.clearCart();
            this.paymobReturnNotice.set(
              `Thank you! Your payment for order #${orderId} was received. Our team will verify and coordinate delivery.`
            );
          } else {
            this.errorMessage.set('Payment could not be confirmed. Please check your banking app.');
          }
        },
      });
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
