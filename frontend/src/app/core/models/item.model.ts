export interface Item {
  _id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  item: Item;
  quantity: number;
}
