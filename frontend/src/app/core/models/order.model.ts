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
}

export interface PaymobDetails {
  intentionId?: string;
  clientSecret?: string;
  paymobOrderId?: string;
  transactionId?: string;
}

export interface Order {
  _id: string;
  userDetails: UserDetails;
  items: OrderItemSnapshot[];
  totalPrice: number;
  paymentMethod: 'cod' | 'paymob';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymobDetails?: PaymobDetails;
  status: 'opened' | 'closed';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  paymentMethod: 'cod' | 'paymob';
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

