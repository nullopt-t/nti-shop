# Spec: Sprint 01 - Clothes Shopping Web Application

## Objective
Establish the foundational architecture and implementation for an e-commerce clothing shop featuring:
1. **Public Storefront**: Product browsing by category, product detail inspection, LocalStorage-backed cart & favorites, and checkout via customer contact submission (finalized by phone call). Inventory quantity is strictly masked from public view.
2. **Manager Dashboard**: Passcode/key-gated administrative interface providing full CRUD for categories and items (with inventory quantity management) and order tracking (opened/closed status toggles and manager notes).

---

## Tech Stack
- **Backend**: Node.js (v20+ LTS), Express.js (v4/v5), Mongoose / MongoDB (v7+).
- **Frontend**: Angular (v18+ with Standalone Components & Signals), RxJS, TypeScript.
- **Styling**: SCSS / CSS structured for high-density, minimalist, high-contrast catalog/board aesthetics.
- **State & Storage**: Client-side `LocalStorage` for public Cart & Favorites; Angular reactive services/signals.
- **Auth**: Passcode/Access Key authentication issuing signed JWT tokens for Manager protected endpoints.

---

## Commands
```bash
# Workspace Root Setup
npm install

# Backend (backend/)
npm --prefix backend run dev       # Start backend in watch mode (nodemon / ts-node-dev)
npm --prefix backend run build     # Build backend (if TypeScript) or check syntax
npm --prefix backend test          # Run backend unit/integration tests (Jest / Supertest)

# Frontend (frontend/)
npm --prefix frontend start        # Start Angular development server (http://localhost:4200)
npm --prefix frontend run build    # Production Angular build
npm --prefix frontend test         # Run frontend unit tests (Karma / Jest)
```

---

## Project Structure
```
nti-project/
├── SPEC.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.js (or server.ts)
│   │   ├── app.js
│   │   ├── config/
│   │   │   └── db.js               # MongoDB connection
│   │   ├── models/
│   │   │   ├── Category.js
│   │   │   ├── Item.js
│   │   │   └── Order.js
│   │   ├── controllers/
│   │   │   ├── categoryController.js
│   │   │   ├── itemController.js
│   │   │   ├── orderController.js
│   │   │   └── authController.js
│   │   ├── routes/
│   │   │   ├── publicRoutes.js     # /api/categories, /api/items, /api/orders
│   │   │   └── managerRoutes.js    # /api/manager/*
│   │   └── middlewares/
│   │       ├── authMiddleware.js   # Validates Manager Key/Token
│   │       └── errorHandler.js
│   └── tests/
│       ├── items.test.js
│       └── orders.test.js
└── frontend/
    ├── package.json
    ├── angular.json
    ├── src/
    │   ├── index.html
    │   ├── styles.scss             # High-density minimal dark/light theme
    │   └── app/
    │       ├── app.routes.ts
    │       ├── core/
    │       │   ├── services/
    │       │   │   ├── api.service.ts
    │       │   │   ├── cart.service.ts
    │       │   │   ├── favorites.service.ts
    │       │   │   └── auth.service.ts
    │       │   ├── guards/
    │       │   │   └── manager-auth.guard.ts
    │       │   └── interceptors/
    │       │       └── auth.interceptor.ts
    │       ├── public/
    │       │   ├── catalog/        # Category filter bar & item grid/table
    │       │   ├── item-detail/    # Detail view (image, title, desc, price)
    │       │   ├── cart/           # Cart view & quantity adjust
    │       │   ├── favorites/      # Bookmarked items
    │       │   └── checkout/       # Name, phone, address submission form
    │       └── manager/
    │           ├── login/          # Key-gate passcode form
    │           ├── dashboard/      # Overview shell & tabs
    │           ├── categories/     # Category CRUD management
    │           ├── items/          # Item CRUD management (+ inventory quantity)
    │           └── orders/         # Order list, status toggle & manager notes
```

---

## Database Schema Design (MongoDB / Mongoose)

### 1. `categories` Collection
```typescript
interface ICategory {
  _id: ObjectId;
  name: string;        // e.g., "Hoodies", "T-Shirts", "Jeans", required, trim, unique
  description?: string;// optional string
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. `items` Collection
```typescript
interface IItem {
  _id: ObjectId;
  categoryId: ObjectId; // ref: 'Category', required, indexed
  name: string;         // e.g., "Classic Black Cotton Hoodie", required, trim
  description: string;  // e.g., "Heavyweight fleece, relaxed fit, size S-XL"
  price: number;        // positive number, required
  image: string;        // single URL string
  quantity: number;     // non-negative integer (restricted to Manager views only)
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. `orders` Collection
```typescript
interface IOrderItemSnapshot {
  itemId: ObjectId;     // ref: 'Item'
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface IOrder {
  _id: ObjectId;
  userDetails: {
    name: string;       // required
    phone: string;      // required (used for phone order confirmation)
    address: string;    // required
  };
  items: IOrderItemSnapshot[]; // array of purchased item snapshots
  totalPrice: number;   // calculated sum of subtotals
  status: 'opened' | 'closed'; // default: 'opened'
  notes?: string;       // Manager notes taken during/after phone confirmation
  createdAt: Date;
  updatedAt: Date;
}
```

---

## API Specification

### Public Endpoints
| Method | Endpoint | Description | Notes |
|---|---|---|---|
| `GET` | `/api/categories` | Retrieve all categories | Public cacheable |
| `GET` | `/api/items` | Retrieve items catalog | Filterable by `categoryId`. **Projection strictly excludes `quantity`** (`-quantity`) |
| `GET` | `/api/items/:id` | Retrieve single item detail | **Projection strictly excludes `quantity`** |
| `POST` | `/api/orders` | Create customer order | Accepts `{ userDetails, items: [{ itemId, quantity }] }`. Server validates prices & items, calculates subtotals, saves status as `opened`. |

### Manager Endpoints (Protected by Access Key / JWT)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/manager/auth` | Validates access key against `MANAGER_ACCESS_KEY`. Returns session token. |
| `GET` | `/api/manager/categories` | List all categories |
| `POST` | `/api/manager/categories` | Create category `{ name, description }` |
| `PUT` | `/api/manager/categories/:id` | Update category `{ name, description }` |
| `DELETE` | `/api/manager/categories/:id` | Delete category (checks for orphan items) |
| `GET` | `/api/manager/items` | List all items **including `quantity`** |
| `POST` | `/api/manager/items` | Create new clothing item with inventory |
| `PUT` | `/api/manager/items/:id` | Update item details and stock quantity |
| `DELETE` | `/api/manager/items/:id` | Delete clothing item |
| `POST` | `/api/manager/upload` | Upload clothing item image file (multipart/form-data) |
| `GET` | `/api/manager/orders` | List customer orders (sorted by `createdAt` desc) |
| `PATCH` | `/api/manager/orders/:id` | Update order status (`opened`/`closed`) and notes |

---

## Code Style & Conventions
- **Backend**: Express MVC separation (Routes purely route, Controllers handle HTTP/status, Models define schema & business validation).
- **Projection Rule**: Controller queries for public items must explicitly use `.select('-quantity')` or projection `{ quantity: 0 }` to prevent stock leaking.
- **Frontend**: Angular Signals (`signal()`, `computed()`) for local store state (Cart, Favorites).
- **UI Aesthetic**: Clean, high-density, functional table/grid layout reminiscent of classic catalog boards:
  - High data readability, monospaced/clean sans-serif fonts for prices and SKUs.
  - Distinct light/dark row striping, clear border outlines, zero fluff/bloat.
  - Fast rendering, instant LocalStorage persistence for Cart and Favorites.

```typescript
// Example: Cart Signal State (frontend)
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly STORAGE_KEY = 'shopping_cart_v1';
  readonly items = signal<CartItem[]>(this.loadFromStorage());
  readonly count = computed(() => this.items().reduce((acc, i) => acc + i.quantity, 0));
  readonly total = computed(() => this.items().reduce((acc, i) => acc + (i.price * i.quantity), 0));

  private loadFromStorage(): CartItem[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
```

---

## Testing Strategy
1. **Backend Integration Tests**:
   - Verify public item endpoints never return `quantity`.
   - Verify order creation calculates accurate subtotals and saves status as `opened`.
   - Verify manager endpoints reject unauthenticated requests (HTTP 401/403).
   - Verify category and item CRUD operations.
2. **Frontend Unit Tests**:
   - `CartService` & `FavoritesService` LocalStorage sync, addition, removal, and calculation logic.
   - `ManagerAuthGuard` redirects unauthenticated users to `/manager/login`.

---

## Boundaries
- **Always do**:
  - Exclude `quantity` on all public item queries at the controller/query level.
  - Verify customer input (name, phone, address, valid items) before saving orders.
  - Store cart and favorites state in `localStorage` synchronously.
- **Ask first**:
  - Altering database schema fields or adding new external libraries.
  - Changing authentication mechanism (e.g. multi-user manager roles vs single access key).
- **Never do**:
  - Expose manager access keys or JWT secrets in client bundles or public repositories.
  - Allow orders to directly modify payment states without telephone confirmation workflow.

---

## Success Criteria
- [ ] Backend runs on Express with Mongoose models for `Category`, `Item`, `Order`.
- [ ] Public endpoints `/api/items` and `/api/items/:id` return status 200 without exposing `quantity`.
- [ ] Public checkout creates an `opened` order in MongoDB and clears the cart.
- [ ] Manager can log in with passcode/key and access Category CRUD, Item CRUD (with quantity), and Order tracking.
- [ ] Manager can toggle order status (`opened` <-> `closed`) and save phone confirmation notes.
- [ ] Angular frontend renders high-density catalog, detail view, cart, favorites, and responsive manager dashboard.

---

## Open Questions & Clarifications
1. **Language & Stack Variant for Backend**: Do you prefer the Node/Express backend written in TypeScript or modern JavaScript (ES Modules)?
2. **Manager Key Storage**: Is a single environment variable `MANAGER_SECRET_KEY` (e.g., in `.env`) sufficient for sprint 01 passcode authentication, or should manager credentials be stored in a MongoDB collection?
3. **Cart Stock Validation**: When a customer places an order via `POST /api/orders`, should the backend automatically deduct/check against inventory `quantity`, or should inventory deduction be handled manually by the manager during phone call confirmation?
