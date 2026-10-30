import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Item } from '../../core/models/item.model';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.scss',
})
export class ManagerDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Active Tab: 'orders' | 'items'
  readonly activeTab = signal<'orders' | 'items'>('orders');

  // Orders State
  readonly orders = signal<Order[]>([]);
  readonly orderStatusFilter = signal<'all' | 'opened' | 'closed'>('all');
  readonly editingNotesMap = signal<{ [orderId: string]: string }>({});

  // Items State (Category Column & CRUD)
  readonly items = signal<Item[]>([]);
  readonly showItemModal = signal<boolean>(false);
  readonly editingItemId = signal<string | null>(null);
  readonly uploadingImage = signal<boolean>(false);
  readonly imagePreview = signal<string | null>(null);
  itemForm = {
    category: '',
    name: '',
    description: '',
    price: 0,
    image: '',
  };

  // Distinct Categories (extracted dynamically from items)
  readonly categories = signal<string[]>([]);

  // Status/Feedback alerts
  readonly notification = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  ngOnInit(): void {
    this.refreshAllData();
  }

  refreshAllData(): void {
    this.loadOrders();
    this.loadItems();
    this.loadCategories();
  }

  notify(text: string, type: 'success' | 'error' = 'success'): void {
    this.notification.set({ text, type });
    setTimeout(() => this.notification.set(null), 3500);
  }

  // --- ORDERS TAB ---
  loadOrders(): void {
    const filter = this.orderStatusFilter() === 'all' ? undefined : this.orderStatusFilter();
    this.api.getManagerOrders(filter).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        const notesMap: { [id: string]: string } = {};
        res.data.forEach((o) => {
          notesMap[o._id] = o.notes || '';
        });
        this.editingNotesMap.set(notesMap);
      },
      error: (err) => this.handleAuthError(err),
    });
  }

  setOrderFilter(status: 'all' | 'opened' | 'closed'): void {
    this.orderStatusFilter.set(status);
    this.loadOrders();
  }

  toggleOrderStatus(order: Order): void {
    const nextStatus = order.status === 'opened' ? 'closed' : 'opened';
    this.api.updateManagerOrder(order._id, { status: nextStatus }).subscribe({
      next: (res) => {
        this.notify(`Order #${order._id.slice(-6)} status updated to ${nextStatus.toUpperCase()}`);
        this.loadOrders();
      },
      error: (err) => this.notify('Failed to update order status', 'error'),
    });
  }

  saveOrderNotes(orderId: string): void {
    const notes = this.editingNotesMap()[orderId] || '';
    this.api.updateManagerOrder(orderId, { notes }).subscribe({
      next: () => this.notify('Manager call notes saved.'),
      error: () => this.notify('Failed to save notes', 'error'),
    });
  }

  // --- ITEMS TAB ---
  loadItems(): void {
    this.api.getManagerItems().subscribe({
      next: (res) => this.items.set(res.data),
      error: (err) => this.handleAuthError(err),
    });
  }

  loadCategories(): void {
    this.api.getManagerCategories().subscribe({
      next: (res) => this.categories.set(res.data),
      error: (err) => this.handleAuthError(err),
    });
  }

  openAddItem(): void {
    this.editingItemId.set(null);
    this.imagePreview.set(null);
    this.itemForm = {
      category: this.categories()[0] || 'Apparel',
      name: '',
      description: '',
      price: 29.99,
      image: '',
    };
    this.showItemModal.set(true);
  }

  openEditItem(item: Item): void {
    this.editingItemId.set(item._id);
    this.imagePreview.set(item.image);
    this.itemForm = {
      category: item.category || '',
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
    };
    this.showItemModal.set(true);
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadingImage.set(true);

    this.api.uploadImage(file).subscribe({
      next: (res) => {
        this.itemForm.image = res.imageUrl;
        this.imagePreview.set(res.imageUrl);
        this.uploadingImage.set(false);
        this.notify('Image uploaded successfully.');
      },
      error: (err) => {
        this.uploadingImage.set(false);
        this.notify(err.error?.message || 'Failed to upload image', 'error');
      },
    });
  }

  saveItem(): void {
    const id = this.editingItemId();
    if (!this.itemForm.name.trim() || !this.itemForm.category.trim()) {
      this.notify('Please fill all required item fields (name, category)', 'error');
      return;
    }

    if (id) {
      // Update
      this.api.updateManagerItem(id, this.itemForm).subscribe({
        next: () => {
          this.notify('Clothing item and inventory updated.');
          this.showItemModal.set(false);
          this.loadItems();
          this.loadCategories();
        },
        error: (err) => this.notify(err.error?.message || 'Failed to update item', 'error'),
      });
    } else {
      // Create
      this.api.createManagerItem(this.itemForm).subscribe({
        next: () => {
          this.notify('New clothing item created in catalog.');
          this.showItemModal.set(false);
          this.loadItems();
          this.loadCategories();
        },
        error: (err) => this.notify(err.error?.message || 'Failed to create item', 'error'),
      });
    }
  }

  deleteItem(id: string): void {
    if (!confirm('Are you sure you want to delete this clothing item?')) return;
    this.api.deleteManagerItem(id).subscribe({
      next: () => {
        this.notify('Item removed from catalog.');
        this.loadItems();
        this.loadCategories();
      },
      error: (err) => this.notify(err.error?.message || 'Failed to delete item', 'error'),
    });
  }

  handleAuthError(err: any): void {
    if (err.status === 401 || err.status === 403) {
      this.auth.logout();
      this.router.navigate(['/manager/login']);
    }
  }
}
