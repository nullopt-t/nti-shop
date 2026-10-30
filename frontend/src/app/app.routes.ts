import { Routes } from '@angular/router';
import { CatalogComponent } from './public/catalog/catalog.component';
import { ItemDetailComponent } from './public/item-detail/item-detail.component';
import { CartComponent } from './public/cart/cart.component';
import { CheckoutComponent } from './public/checkout/checkout.component';
import { FavoritesComponent } from './public/favorites/favorites.component';
import { ManagerLoginComponent } from './manager/login/manager-login.component';
import { ManagerDashboardComponent } from './manager/dashboard/manager-dashboard.component';
import { managerAuthGuard } from './core/guards/manager-auth.guard';

export const routes: Routes = [
  { path: '', component: CatalogComponent, title: 'ROCK // Collection' },
  { path: 'items/:id', component: ItemDetailComponent, title: 'ROCK // Product' },
  { path: 'cart', component: CartComponent, title: 'ROCK // Bag' },
  { path: 'checkout', component: CheckoutComponent, title: 'ROCK // Checkout' },
  { path: 'favorites', component: FavoritesComponent, title: 'ROCK // Saved' },
  { path: 'manager/login', component: ManagerLoginComponent, title: 'ROCK // Console Access' },
  {
    path: 'manager/dashboard',
    component: ManagerDashboardComponent,
    canActivate: [managerAuthGuard],
    title: 'ROCK // Operations Console',
  },
  { path: '**', redirectTo: '' },
];
