import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Item } from '../models/item.model';

describe('CartService', () => {
  let service: CartService;
  const mockItem: Item = {
    _id: 'item-101',
    category: 'Hoodies',
    name: 'Sample Raw Denim Jeans',
    description: 'Heavyweight selvedge jeans',
    price: 80.0,
    image: 'https://example.com/denim.jpg',
  };

  beforeEach(() => {
    if (typeof localStorage !== 'undefined' && localStorage.clear) {
      localStorage.clear();
    }
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clearCart();
  });

  afterEach(() => {
    if (typeof localStorage !== 'undefined' && localStorage.clear) {
      localStorage.clear();
    }
  });

  it('should initialize with empty cart', () => {
    expect(service.items().length).toBe(0);
    expect(service.count()).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('should add item and update totals', () => {
    service.addItem(mockItem, 2);
    expect(service.items().length).toBe(1);
    expect(service.count()).toBe(2);
    expect(service.total()).toBe(160.0);
  });

  it('should update quantity of existing item in cart', () => {
    service.addItem(mockItem, 1);
    service.addItem(mockItem, 3);
    expect(service.count()).toBe(4);
    expect(service.total()).toBe(320.0);

    service.updateQuantity('item-101', 1);
    expect(service.count()).toBe(1);
    expect(service.total()).toBe(80.0);
  });

  it('should remove item when quantity set to 0 or removeItem invoked', () => {
    service.addItem(mockItem, 2);
    service.removeItem('item-101');
    expect(service.items().length).toBe(0);
    expect(service.count()).toBe(0);
  });
});
