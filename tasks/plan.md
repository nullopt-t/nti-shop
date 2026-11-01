# Implementation Plan: Sprint 01 - Clothes Shopping Web Application

## Overview
Build Sprint 01 of the clothes-shopping web application consisting of a Node.js/Express MVC backend with MongoDB (running via Docker) and an Angular standalone frontend featuring a public storefront and passcode-gated manager dashboard.

## Architecture Decisions
- **Database**: MongoDB running in a Docker container (`mongo:latest`) exposed on port `27017`.
- **Backend Architecture**: Express.js MVC pattern with dedicated Models, Controllers, Routes, and Middleware. Public item endpoints strictly strip `quantity` using projection (`-quantity`).
- **Authentication**: Manager passcode verification (`POST /api/manager/auth`) against `MANAGER_ACCESS_KEY`, issuing a JWT token verified via `authMiddleware` for `/api/manager/*` routes.
- **Frontend Architecture**: Angular 18/19 with Standalone Components and Signals for reactive state. Public cart and favorites persist directly to `localStorage`.
- **Design Aesthetic**: High-density, minimalist, functional board/catalog style (dark/light contrast rows, crisp borders, monospaced pricing, zero bloat).

## Task List

### Phase 1: Infrastructure & Scaffolding
- [x] Task 1: Docker Compose for MongoDB & project directory initialization
- [x] Task 2: Backend initialization (Express, Mongoose, dotenv, cors, morgan, jsonwebtoken) & database connection

### Checkpoint 1: Infrastructure & DB
- [x] MongoDB container healthy
- [x] Backend connects to MongoDB

### Phase 2: Backend MVC & Core APIs
- [x] Task 3: Mongoose Models (`Category`, `Item`, `Order`) and database seed script
- [x] Task 4: Public Routes & Controllers (`GET /api/categories`, `GET /api/items`, `GET /api/items/:id` with quantity projection stripped, `POST /api/orders`)
- [x] Task 5: Manager Auth & Protected CRUD Routes (`POST /api/manager/auth`, category CRUD, item CRUD with `quantity`, order list & `PATCH /api/manager/orders/:id`)
- [x] Task 6: Backend automated integration test suite (verifying quantity redaction, auth gate, order calculations)

### Checkpoint 2: Backend Complete & Verified
- [x] All public endpoints functional and tested
- [x] Manager endpoints protected and functional
- [x] Automated API tests passing

### Phase 3: Frontend Foundations & State
- [x] Task 7: Angular application setup, high-density minimal styling theme, and core services (`ApiService`, `CartService`, `FavoritesService`, `AuthService`, `ManagerAuthGuard`)

### Phase 4: Frontend Public Storefront
- [x] Task 8: Public Catalog Grid & Category Filter, Item Detail View, Cart View, and Phone-Order Checkout Form

### Phase 5: Frontend Manager Dashboard
- [x] Task 9: Manager Key-Gate Login & Dashboard tabs: Categories CRUD, Items CRUD (with inventory quantity), and Orders Management (status toggling & manager notes)

### Checkpoint 3: End-to-End System
- [x] Customer flow: Browse items -> view item -> add to cart/favorites -> checkout order
- [x] Manager flow: Enter passcode -> add/edit category -> add/edit item stock -> view order -> toggle opened/closed & update notes
- [x] Quantity is never leaked to public browser network inspection

### Phase 6: Paymob Gateway & Dual Payment Mode
- [x] Task 10: Backend Paymob Service using latest Intentions API (`v1/intention`) with zero extra libraries
- [x] Task 11: Backend Order Controller dual payment handling (`cod` vs `paymob`) and HMAC-SHA512 Webhook receiver
- [x] Task 12: Frontend Checkout component payment method switch (COD with full details vs Paymob Gateway with fallback contact)
- [x] Task 13: Manager Dashboard payment method and settlement status indicators


## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Inventory stock leaked to public | High | Enforce projection `select('-quantity')` in Mongoose queries and sanitize response objects |
| Angular Node version compatibility | Medium | Use `fnm use 20` or `22` LTS for stable Angular compilation |
| LocalStorage cart desynchronization | Low | Use Angular Signals with `effect()` or synchronous storage writes |
