import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';
import { Item } from '../models/item.model';

describe('FavoritesService', () => {
  let service: FavoritesService;
  const mockItem: Item = {
    _id: 'item-202',
    category: 'Hoodies',
    name: 'Classic Black Cotton Hoodie',
    description: '450 GSM fleece',
    price: 65.0,
    image: 'https://example.com/hoodie.jpg',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should toggle favorite status on and off', () => {
    expect(service.isFavorite('item-202')).toBe(false);
    service.toggleFavorite(mockItem);
    expect(service.isFavorite('item-202')).toBe(true);
    expect(service.count()).toBe(1);

    service.toggleFavorite(mockItem);
    expect(service.isFavorite('item-202')).toBe(false);
    expect(service.count()).toBe(0);
  });
});
