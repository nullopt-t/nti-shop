# Clothes Shopping Web Application — Sprint 01

A clothes-shopping web application built with a **Node.js-Express MVC** backend and an **Angular** frontend, featuring a high-density, minimalist board/catalog UI inspired by classic functional boards.

---

## Architecture Overview

```
nti-project/
├── docker-compose.yml              # MongoDB container (mongo:latest on port 27017)
├── SPEC.md                         # Technical Specification & Architecture Contract
├── tasks/
│   ├── plan.md                     # Implementation plan
│   └── todo.md                     # Task breakdown checklist
├── backend/
│   ├── src/
│   │   ├── config/db.js            # Mongoose connection
│   │   ├── models/                 # Category, Item, Order schemas
│   │   ├── controllers/            # Public & Manager controllers
│   │   ├── routes/                 # Public & Manager route modules
│   │   ├── middlewares/            # JWT / passcode auth & error handling
│   │   ├── seeds/seed.js           # Database seeder
│   │   ├── app.js                  # Express application setup
│   │   └── server.js               # Server entry point
│   └── tests/
│       ├── api.test.js             # Automated API integration tests
│       └── e2e_verification.js     # End-to-end full stack validation
└── frontend/
    ├── src/
    │   ├── styles.scss             # High-density dark minimalist catalog theme
    │   └── app/
    │       ├── core/               # ApiService, CartService, FavoritesService, AuthService, Guards
    │       ├── public/             # Catalog, Item Detail, Cart, Favorites, Checkout
    │       └── manager/            # Passcode Login, Dashboard (Orders, Items, Categories)
    └── angular.json
```

---

## Key Features & Security Guardrails

### 1. Public Storefront
- **Browse & Filter**: Filter clothing items by category tabs or view full catalog.
- **Product Detail**: Single clothing image, title, price, description, and quantity selector.
- **Strict Stock Security**: The controller and database queries explicitly strip `quantity` (`.select('-quantity')`), preventing inventory stock levels from leaking to public users.
- **Local Storage State**: Cart and Favorites persist directly to `localStorage` using Angular Signals.
- **Phone Confirmation Checkout**: Orders are submitted with customer contact details (`name`, `phone`, `address`) into an `opened` state. Final purchases and deliveries are verified via phone calls.

### 2. Manager Dashboard
- **Passcode Key Gate**: Access protected by `POST /api/manager/auth` (Default Sprint 01 key: `manager123`).
- **Category CRUD**: Create, edit, and safely delete categories (with orphan item protections).
- **Item & Inventory Management**: View, create, and update clothing items, including stock `quantity`.
- **Image File Upload**: Upload local clothing pictures (`PNG`, `JPEG`, `WebP`, `GIF`) with live preview, or paste direct URLs.
- **Order Tracking**:
  - Filter orders by status (`opened` vs `closed`).
  - One-click status toggling (`opened` ⇄ `closed`).
  - Inline manager notes editor for saving details gathered during telephone confirmation.

---

## Quick Start Guide

### 1. Start MongoDB (Docker)
```bash
docker compose up -d
```

### 2. Run Both Backend & Frontend (One Command)
From the project root:
```bash
npm start
# or: npm run dev
```
- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:4200`

### 3. Individual Commands (Optional)
```bash
npm run seed              # Seed database catalog items
npm test                  # Run both backend and frontend test suites
npm run build             # Build frontend production bundle
npm run start:backend     # Start backend only
npm run start:frontend    # Start frontend only
```

---

## Credentials (Sprint 01 Development)
- **Manager Access Key**: `manager123`
