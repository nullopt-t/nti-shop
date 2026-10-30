# Task List: Sprint 01 Implementation

## Phase 1: Infrastructure & Scaffolding

### Task 1: Docker Compose for MongoDB & Base Directory Setup
- [x] Task: Set up `docker-compose.yml` for MongoDB container with data persistence, verify container runs and accepts connections.
  - Acceptance: `docker compose up -d` starts MongoDB container on port `27017` successfully.
  - Verify: Container is running and port `27017` is listening.
  - Files: `docker-compose.yml`, `.gitignore`

### Task 2: Backend Initialization & Database Connection
- [x] Task: Initialize `backend/` with `package.json`, install Express, Mongoose, dotenv, cors, jsonwebtoken, and implement DB connection module.
  - Acceptance: Express server starts on port `5000` and connects cleanly to MongoDB with health check endpoint `GET /api/health`.
  - Verify: `curl http://localhost:5000/api/health` returns status ok.
  - Files: `backend/package.json`, `backend/.env.example`, `backend/src/server.js`, `backend/src/app.js`, `backend/src/config/db.js`

## Checkpoint 1: Infrastructure
- [x] MongoDB container running and responsive
- [x] Backend server runs and connects to MongoDB

---

## Phase 2: Backend MVC & Core APIs

### Task 3: Mongoose Models & Data Seeder
- [x] Task: Implement Mongoose schemas for `Category`, `Item`, and `Order`, and create a seed script with sample clothing items and categories.
  - Acceptance: Valid schemas with required fields, enums (`status: 'opened' | 'closed'`), and relations. Seed script populates categories and items with initial inventory.
  - Verify: Seed script executes successfully and populates database.
  - Files: `backend/src/models/Category.js`, `backend/src/models/Item.js`, `backend/src/models/Order.js`, `backend/src/seeds/seed.js`

### Task 4: Public Catalog & Order Endpoints
- [x] Task: Implement public controllers and routes for categories, clothing items (with quantity strictly excluded), and order creation.
  - Acceptance: `GET /api/categories`, `GET /api/items` (stripped of `quantity`), `GET /api/items/:id` (stripped of `quantity`), and `POST /api/orders` creating `opened` orders.
  - Verify: HTTP tests confirm quantity is not returned on public endpoints; order creation calculates totals accurately.
  - Files: `backend/src/controllers/categoryController.js`, `backend/src/controllers/itemController.js`, `backend/src/controllers/orderController.js`, `backend/src/routes/publicRoutes.js`

### Task 5: Manager Auth & Administrative CRUD Endpoints
- [x] Task: Implement passcode authentication (`POST /api/manager/auth`), JWT middleware, Category CRUD, Item CRUD (with inventory `quantity`), and Order management (`GET /api/manager/orders`, `PATCH /api/manager/orders/:id`).
  - Acceptance: Protected endpoints require valid manager token. Manager can view and update inventory quantities and modify order status/notes.
  - Verify: Unauthorized requests receive 401; authorized requests perform full CRUD and update order notes/status.
  - Files: `backend/src/middlewares/authMiddleware.js`, `backend/src/controllers/managerController.js`, `backend/src/routes/managerRoutes.js`

### Task 6: Automated Integration Test Suite
- [x] Task: Write automated integration tests (using Supertest and Jest/Node test runner) verifying API security boundaries, quantity stripping, and order workflow.
  - Acceptance: All tests pass with 100% green status.
  - Verify: `npm --prefix backend test` runs and passes.
  - Files: `backend/tests/api.test.js`

## Checkpoint 2: Backend Verified
- [x] All public and manager endpoints working and covered by tests
- [x] Quantity redaction strictly verified

---

## Phase 3: Frontend Foundations & State

### Task 7: Angular Project Setup & Core State Services
- [x] Task: Scaffold Angular application in `frontend/`, implement high-density minimalist theme, API client, LocalStorage-backed `CartService` and `FavoritesService` with Angular Signals, and `AuthService` with `ManagerAuthGuard`.
  - Acceptance: Application compiles without errors; services manage cart and favorites reactivity and persist to LocalStorage.
  - Verify: `npm --prefix frontend build` completes cleanly.
  - Files: `frontend/package.json`, `frontend/src/styles.scss`, `frontend/src/app/core/*`

---

## Phase 4: Frontend Public Storefront

### Task 8: Public Storefront Views & Phone Order Checkout
- [x] Task: Implement public views: high-density Catalog with category filter tabs, Item Detail view (single image, title, price, description), Cart drawer/page with quantity adjustment, Favorites list, and Checkout Form (Name, Phone, Address).
  - Acceptance: User can browse items, filter by category, add to cart/favorites, and submit an order which resets the cart and shows confirmation with phone follow-up notice.
  - Verify: Catalog renders items; adding items updates cart badge; checkout submits payload to `/api/orders`.
  - Files: `frontend/src/app/public/*`

---

## Phase 5: Frontend Manager Dashboard

### Task 9: Manager Dashboard & Administrative Operations
- [x] Task: Implement Manager Key-Gate Login, route protection guard, and tabbed dashboard for Categories CRUD, Items CRUD (with inventory `quantity`), and Orders management (status badge toggle & notes editor).
  - Acceptance: Passcode unlocks dashboard; manager can manage categories, create/update clothing items and stock levels, view orders, and edit phone confirmation notes.
  - Verify: Manager CRUD operations interact with API and update views immediately.
  - Files: `frontend/src/app/manager/*`

## Checkpoint 3: End-to-End Verification
- [x] Full application runs smoothly (Docker Mongo + Express backend + Angular frontend)
- [x] Public customer flow tested end-to-end
- [x] Manager administrative operations verified end-to-end
