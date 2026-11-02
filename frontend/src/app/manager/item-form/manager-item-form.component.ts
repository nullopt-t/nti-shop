import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { Item } from '../../core/models/item.model';

@Component({
  selector: 'app-manager-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manager-item-form.component.html',
  styleUrl: './manager-item-form.component.scss',
})
export class ManagerItemFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  readonly langService = inject(LanguageService);

  readonly itemId = signal<string | null>(null);
  readonly isEditMode = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly uploadingImage = signal<boolean>(false);
  readonly notification = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  readonly categories = signal<string[]>([]);
  readonly imagePreview = signal<string | null>(null);

  // Form Model
  itemForm = {
    category: '',
    name: '',
    description: '',
    price: 0,
    image: '',
    translations: {
      ar: {
        name: '',
        category: '',
        description: '',
      },
    },
  };

  ngOnInit(): void {
    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.itemId.set(id);
      this.isEditMode.set(true);
      this.loadItemData(id);
    }
  }

  loadCategories(): void {
    this.api.getManagerCategories().subscribe({
      next: (res) => {
        this.categories.set(res.data);
        if (!this.itemForm.category && res.data.length > 0 && !this.isEditMode()) {
          this.itemForm.category = res.data[0];
        }
      },
      error: (err) => this.handleAuthError(err),
    });
  }

  loadItemData(id: string): void {
    this.loading.set(true);
    this.api.getManagerItemById(id).subscribe({
      next: (res) => {
        const item = res.data;
        const arTrans = item.translations?.['ar'] || (item.translations instanceof Map ? (item.translations as any).get('ar') : {}) || {};

        this.itemForm = {
          category: item.category || '',
          name: item.name || '',
          description: item.description || '',
          price: item.price || 0,
          image: item.image || '',
          translations: {
            ar: {
              name: arTrans.name || '',
              category: arTrans.category || '',
              description: arTrans.description || '',
            },
          },
        };
        this.imagePreview.set(item.image || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify('Failed to load product details.', 'error');
        this.handleAuthError(err);
      },
    });
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

  saveProduct(): void {
    if (!this.itemForm.name.trim() || !this.itemForm.category.trim() || !this.itemForm.description.trim()) {
      this.notify('Please fill all required English fields (name, category, description)', 'error');
      return;
    }

    if (this.itemForm.price < 0) {
      this.notify('Price must be greater than or equal to zero', 'error');
      return;
    }

    this.saving.set(true);

    // Build payload ensuring translations are clean
    const payload: Partial<Item> = {
      category: this.itemForm.category.trim(),
      name: this.itemForm.name.trim(),
      description: this.itemForm.description.trim(),
      price: Number(this.itemForm.price),
      image: this.itemForm.image ? this.itemForm.image.trim() : '',
      translations: {
        ar: {
          name: this.itemForm.translations.ar.name.trim(),
          category: this.itemForm.translations.ar.category.trim(),
          description: this.itemForm.translations.ar.description.trim(),
        },
      },
    };

    const id = this.itemId();
    if (id) {
      // Update existing
      this.api.updateManagerItem(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.notify('Product and translations updated successfully.');
          setTimeout(() => this.router.navigate(['/manager/dashboard']), 800);
        },
        error: (err) => {
          this.saving.set(false);
          this.notify(err.error?.message || 'Failed to update product', 'error');
        },
      });
    } else {
      // Create new
      this.api.createManagerItem(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.notify('New product and translations created.');
          setTimeout(() => this.router.navigate(['/manager/dashboard']), 800);
        },
        error: (err) => {
          this.saving.set(false);
          this.notify(err.error?.message || 'Failed to create product', 'error');
        },
      });
    }
  }

  notify(text: string, type: 'success' | 'error' = 'success'): void {
    this.notification.set({ text, type });
    setTimeout(() => this.notification.set(null), 3500);
  }

  handleAuthError(err: any): void {
    if (err.status === 401 || err.status === 403) {
      this.auth.logout();
      this.router.navigate(['/manager/login']);
    }
  }
}
