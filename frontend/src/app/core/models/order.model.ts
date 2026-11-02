export interface OrderItemSnapshot {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface UserDetails {
  name: string;
  phone: string;
  address: string;
  email?: string;
}

export interface PaymobDetails {
  intentionId?: string;
  clientSecret?: string;
  paymobOrderId?: string;
  transactionId?: string;
}

export interface StripeDetails {
  sessionId?: string;
  paymentIntentId?: string;
  customerEmail?: string;
}

export type PaymentMethodType = 'cod' | 'paymob' | 'stripe';

export interface OrderNote {
  time: string;
  content: string;
}

export interface Order {
  _id: string;
  userDetails: UserDetails;
  items: OrderItemSnapshot[];
  totalPrice: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymobDetails?: PaymobDetails;
  stripeDetails?: StripeDetails;
  status: 'opened' | 'closed';
  notes?: OrderNote[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  paymentMethod: PaymentMethodType;
  userDetails: Partial<UserDetails>;
  items: {
    itemId: string;
    quantity: number;
  }[];
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  data: Order;
  checkoutUrl?: string;
}
