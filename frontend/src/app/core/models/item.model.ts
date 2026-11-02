export interface ItemTranslation {
  name?: string;
  description?: string;
  category?: string;
}

export interface Item {
  _id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
  translations?: {
    [lang: string]: ItemTranslation;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  item: Item;
  quantity: number;
}
