import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { Order, CreateOrderPayload, PaymentMethodType } from '../../core/models/order.model';

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
  readonly langService = inject(LanguageService);

  paymentMethod: PaymentMethodType = 'cod';
  readonly availableMethods = signal<PaymentMethodType[]>(['cod', 'stripe']);
  name = '';
  phone = '';
  address = '';
  email = '';

  readonly submitting = signal<boolean>(false);
  readonly verifyingPayment = signal<boolean>(false);
  readonly redirecting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completedOrder = signal<Order | null>(null);
  readonly paymentReturnNotice = signal<string | null>(null);

  ngOnInit(): void {
    // Fetch available payment methods configured in the backend
    this.api.getPaymentMethods().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const methods = res.data as PaymentMethodType[];
          this.availableMethods.set(methods);
          if (!methods.includes(this.paymentMethod)) {
            this.paymentMethod = methods[0];
          }
        }
      },
      error: () => {
        // Fallback to safe default
        this.availableMethods.set(['cod']);
        this.paymentMethod = 'cod';
      },
    });

    // Check if returning from payment gateway redirect
    const params = this.route.snapshot.queryParams;
    const orderId = params['orderId'];
    const sessionId = params['session_id'];
    const isCancelled = params['cancelled'] === 'true';

    if (isCancelled) {
      this.errorMessage.set('Payment was cancelled at the checkout gateway. You can retry or choose an alternative method.');
      return;
    }

    if (orderId) {
      this.verifyingPayment.set(true);
      const isSuccessParam = params['success'] === 'true' || Boolean(sessionId);
      const isPendingParam = params['pending'] === 'true';
      const isFailedParam = params['success'] === 'false';

      if (isFailedParam) {
        this.verifyingPayment.set(false);
        this.errorMessage.set(this.langService.t().paymentDeclinedMsg);
        return;
      }

      // Verify status directly from server database (with direct Stripe session retrieval if session_id is provided)
      this.api.getOrderStatus(orderId, sessionId).subscribe({
        next: (res) => {
          this.verifyingPayment.set(false);
          this.cartService.clearCart();
          const ord = res.data;

          if (ord.paymentStatus === 'paid' || isSuccessParam) {
            this.paymentReturnNotice.set(
              this.langService.t().paymentConfirmedMsg(ord._id, ord.totalPrice.toFixed(2))
            );
          } else if (ord.paymentStatus === 'pending' || isPendingParam) {
            this.paymentReturnNotice.set(
              this.langService.t().paymentPendingMsg(ord._id)
            );
          } else {
            this.errorMessage.set(
              this.langService.t().paymentDeclinedMsg
            );
          }
        },
        error: () => {
          this.verifyingPayment.set(false);
          if (isSuccessParam) {
            this.cartService.clearCart();
            this.paymentReturnNotice.set(
              this.langService.t().paymentConfirmedMsg(orderId, '0.00')
            );
          } else {
            this.errorMessage.set(this.langService.t().paymentDeclinedMsg);
          }
        },
      });
    }
  }

  isMethodAvailable(method: PaymentMethodType): boolean {
    return this.availableMethods().includes(method);
  }

  setPaymentMethod(method: PaymentMethodType): void {
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
        email: this.email.trim() || undefined,
      },
      items: this.cartService.items().map((entry) => ({
        itemId: entry.item._id,
        quantity: entry.quantity,
      })),
    };

    this.api.submitOrder(payload).subscribe({
      next: (res) => {
        // Redirect to gateway if checkoutUrl is returned
        if (this.paymentMethod === 'stripe' && res.checkoutUrl) {
          this.redirecting.set(true);
          window.location.href = res.checkoutUrl;
          return;
        }

        this.submitting.set(false);
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
