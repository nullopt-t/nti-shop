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
  readonly paymentStatusFilter = signal<'all' | 'paid' | 'pending'>('all');
  readonly editingNotesMap = signal<{ [orderId: string]: string }>({});

  // Items State (Category Column & CRUD)
  readonly items = signal<Item[]>([]);

  // Distinct Categories (extracted dynamically from items)
  readonly categories = signal<string[]>([]);

  // Status/Feedback alerts
  readonly notification = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  // Custom Delete Confirmation Modal State
  readonly itemToDelete = signal<Item | null>(null);
  readonly deletingItem = signal<boolean>(false);

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

  getItemDisplayName(itm: Item): string {
    const lang = this.langService.currentLanguage();
    if (lang !== 'en' && itm.translations?.[lang]?.name) {
      return itm.translations[lang].name!;
    }
    return itm.name;
  }

  getItemDisplayDescription(itm: Item): string {
    const lang = this.langService.currentLanguage();
    if (lang !== 'en' && itm.translations?.[lang]?.description) {
      return itm.translations[lang].description!;
    }
    return itm.description;
  }

  getItemDisplayCategory(itm: Item): string {
    const lang = this.langService.currentLanguage();
    if (lang !== 'en' && itm.translations?.[lang]?.category) {
      return itm.translations[lang].category!;
    }
    return itm.category;
  }

  getOrderItemDisplayName(it: any): string {
    const lang = this.langService.currentLanguage();
    if (lang !== 'en') {
      // 1. Check snapshot translations
      if (it.translations?.[lang]?.name) {
        return it.translations[lang].name;
      }
      // 2. Check populated itemId translations (for existing and new orders)
      const populatedItem = typeof it.itemId === 'object' && it.itemId !== null ? it.itemId : null;
      if (populatedItem?.translations?.[lang]?.name) {
        return populatedItem.translations[lang].name;
      }
      // 3. Check loaded items map
      const foundItem = this.items().find((item) => item._id === (populatedItem?._id || it.itemId));
      if (foundItem?.translations?.[lang]?.name) {
        return foundItem.translations[lang].name;
      }
    }
    return it.name;
  }

  // --- ORDERS TAB ---
  loadOrders(): void {
    const statusFilter = this.orderStatusFilter() === 'all' ? undefined : this.orderStatusFilter();
    const paymentFilter = this.paymentStatusFilter() === 'all' ? undefined : this.paymentStatusFilter();
    this.api.getManagerOrders(statusFilter, paymentFilter).subscribe({
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

  setPaymentFilter(paymentStatus: 'all' | 'paid' | 'pending'): void {
    this.paymentStatusFilter.set(paymentStatus);
    this.loadOrders();
  }

  toggleOrderStatus(order: Order): void {
    const nextStatus = order.status === 'opened' ? 'closed' : 'opened';
    this.api.updateManagerOrder(order._id, { status: nextStatus }).subscribe({
      next: (res) => {
        this.notify(this.langService.t().toastOrderUpdated(order._id.slice(-6), nextStatus.toUpperCase()));
        this.loadOrders();
      },
      error: (err) => this.notify(this.langService.t().toastOrderUpdateFailed, 'error'),
    });
  }

  saveOrderNotes(orderId: string): void {
    const noteText = (this.editingNotesMap()[orderId] || '').trim();
    if (!noteText) {
      this.notify(this.langService.t().toastNoteEmpty, 'error');
      return;
    }

    this.api.updateManagerOrder(orderId, { notes: noteText }).subscribe({
      next: () => {
        this.notify(this.langService.t().toastNoteSaved);
        // Clear input for this order
        const map = { ...this.editingNotesMap() };
        map[orderId] = '';
        this.editingNotesMap.set(map);
        this.loadOrders();
      },
      error: () => this.notify(this.langService.t().toastNoteFailed, 'error'),
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

  promptDeleteItem(item: Item): void {
    this.itemToDelete.set(item);
  }

  cancelDeleteItem(): void {
    this.itemToDelete.set(null);
  }

  confirmDeleteItem(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.deletingItem.set(true);
    this.api.deleteManagerItem(item._id).subscribe({
      next: () => {
        this.deletingItem.set(false);
        this.itemToDelete.set(null);
        this.notify(this.langService.t().toastItemDeleted);
        this.loadItems();
        this.loadCategories();
      },
      error: (err) => {
        this.deletingItem.set(false);
        this.notify(err.error?.message || this.langService.t().toastItemDeleteFailed, 'error');
      },
    });
  }

  handleAuthError(err: any): void {
    if (err.status === 401 || err.status === 403) {
      this.auth.logout();
      this.router.navigate(['/manager/login']);
    }
  }
}
