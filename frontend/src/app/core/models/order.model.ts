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

export interface Order {
  _id: string;
  userDetails: UserDetails;
  items: OrderItemSnapshot[];
  totalPrice: number;
  status: 'opened' | 'closed';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  userDetails: UserDetails;
  items: {
    itemId: string;
    quantity: number;
  }[];
}
