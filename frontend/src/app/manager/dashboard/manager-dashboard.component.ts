import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { Item } from '../../core/models/item.model';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.scss',
})
export class ManagerDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly langService = inject(LanguageService);

  // Active Tab: 'orders' | 'items'
  readonly activeTab = signal<'orders' | 'items'>('orders');

  // Orders State
  readonly orders = signal<Order[]>([]);
  readonly orderStatusFilter = signal<'all' | 'opened' | 'closed'>('all');
  readonly editingNotesMap = signal<{ [orderId: string]: string }>({});

  // Items State (Category Column & CRUD)
  readonly items = signal<Item[]>([]);

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
    const noteText = (this.editingNotesMap()[orderId] || '').trim();
    if (!noteText) {
      this.notify('Please enter a note before adding to log', 'error');
      return;
    }

    this.api.updateManagerOrder(orderId, { notes: noteText }).subscribe({
      next: () => {
        this.notify('New log entry recorded.');
        // Clear input for this order
        const map = { ...this.editingNotesMap() };
        map[orderId] = '';
        this.editingNotesMap.set(map);
        this.loadOrders();
      },
      error: () => this.notify('Failed to save log entry', 'error'),
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

  deleteItem(id: string): void {
    if (!confirm(this.langService.t().confirmDelete)) return;
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
