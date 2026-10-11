# StockFlow

**Inventory management that keeps stock accountable.**

StockFlow is a multi-tenant inventory management application built with the MERN stack. It helps businesses manage products, suppliers, purchases, stock movements, and orders from one place.

The main goal is to maintain accurate stock quantities throughout the inventory lifecycle and prevent multiple orders from reserving the same available stock.

## Why StockFlow?

Managing inventory is not just about knowing how many items are in stock. A business also needs to know which units are available, which are reserved for pending orders, and which have already been sold.

StockFlow keeps these quantities separate so that stock availability remains consistent as purchases are received and orders move through their payment lifecycle.

## Features

### Business and User Management
- Multi-tenant architecture with separate business data.
- JWT-based authentication.
- Role-based access for Super Admins, Business Admins, and Staff.
- Business and staff management with account suspension controls.
- Tenant-specific access restrictions.

### Product Management
- Create, view, and update products.
- Maintain product names, SKUs, descriptions, categories, selling prices, and image URLs.
- Configure product-level low-stock thresholds.
- Deactivate products without deleting their historical records.

### Supplier and Purchase Management
- Maintain supplier details.
- Create purchase records with product quantities and costs.
- Receive purchases to increase available inventory.
- Track inventory changes through stock movement records.

### Inventory Management
- View available, reserved, sold, and total stock.
- Record inventory movements.
- Preserve stock history for traceability.
- Use database transactions for critical stock updates.

### Orders and Reservations
- Browse a business's public storefront.
- Create orders without requiring a customer account.
- Reserve stock when an order is placed.
- Release reserved stock when an eligible order is cancelled, payment fails, or its reservation expires.
- Move reserved stock to sold stock after successful payment confirmation.
- Handle late payment events through a manual-resolution workflow.

### Payments
- Razorpay integration for payment creation and verification.
- Tenant-specific Razorpay credentials.
- Webhook handling for supported payment events.
- Idempotent payment processing to prevent duplicate stock updates.
- No automatic refunds for cancelled orders.

### Low-Stock Alerts
- Detect products whose available quantity falls below their applicable threshold.
- Send email alerts to eligible Business Admins.
- Resolve active alerts when stock is no longer below the threshold.

### Dashboard and Analytics
- Stock overview and low-stock counts.
- Sales summaries.
- Top-selling products ranked by quantity sold.
- Order summaries and recent order activity.
- Revenue calculated from paid orders and historical item prices.

## Core Inventory Rule

StockFlow follows this inventory invariant:

**Available + Reserved + Sold = Total Quantity Received**

Each quantity represents a different state of the inventory.

| Quantity | Meaning |
|---|---|
| Available | Stock that can be allocated to new orders |
| Reserved | Stock held for pending orders |
| Sold | Stock allocated to successfully paid orders |
| Total received | Cumulative quantity received through purchase records |

For example, if a business receives 100 units and a customer places an order for 10 units, the inventory becomes:

| State | Quantity |
|---|---:|
| Available | 90 |
| Reserved | 10 |
| Sold | 0 |
| Total received | 100 |

When payment succeeds, the 10 reserved units become sold. If the order is cancelled before payment, or payment fails or the reservation expires, those units return to available stock when the applicable order rules permit it.

These transitions are designed to keep stock consistent under concurrent requests.

## Order Lifecycle

The normal order lifecycle is:

1. A customer opens the public storefront.
2. The customer selects active products and quantities.
3. The backend validates product availability and calculates prices.
4. The backend creates a pending-payment order and reserves the required stock.
5. The customer proceeds through Razorpay payment.
6. A verified payment event finalizes the order and moves reserved stock to sold stock.
7. If payment fails, the order is cancelled, or the reservation expires under the applicable rules, the reserved quantity is released.
8. A payment received after the reservation is no longer valid is flagged for manual resolution rather than automatically selling stock that is no longer reserved.

Reservation expiry is processed by a scheduled server-side process. The scheduler runs at one-minute intervals.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | React.js |
| Frontend tooling | Vite |
| Routing | React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT |
| Password hashing | bcryptjs |
| Payments | Razorpay |
| Email | Nodemailer with Gmail SMTP |
| API communication | REST API |
| Deployment target | Vercel (frontend), Render (backend) |

The project does not use TypeScript or an AI/ML service in its current scope.

## Project Structure

```text
StockFlow/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── context/
│   │   ├── layouts/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── docs/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed/
│   │   ├── services/
│   │   ├── uploads/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── constants.js
│   ├── index.js
│   └── package.json
├── README.md
├── PROJECT_DOC.md
└── .gitignore
```

The structure above describes the intended project organization. Refer to the actual repository for the current list of files.

## Getting Started

### Prerequisites

Install the following before running the application:

- Node.js and npm.
- A MongoDB Atlas cluster or another compatible MongoDB deployment.
- Git.
- Razorpay test credentials for payment testing.
- Gmail SMTP credentials if email delivery needs to be tested.

### 1. Clone the Repository

```bash
git clone https://github.com/avni749/StockFlow.git
cd StockFlow
```

### 2. Configure the Backend

Open a terminal in the project root:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory. Use the following variables with your own values:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d

SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=your_admin_email
SUPER_ADMIN_PASSWORD=your_strong_admin_password
```

Do not commit this file to GitHub.

**MongoDB connection:** Obtain the current connection string from MongoDB Atlas under **Connect → Drivers**. Replace the placeholders with your own database credentials. If the password contains reserved URL characters, encode them correctly for use in a URI.

**Super Admin:** Configure the Super Admin environment variables and use the seed process implemented in the backend to create the initial administrative account. Check the existing backend scripts before running a seed command.

**Razorpay and email:** Configure tenant-specific Razorpay credentials and the Gmail SMTP settings using the configuration names expected by the existing backend. Do not assume that payment or email delivery works until it has been tested with valid credentials.

### 3. Start the Backend

From the `server` directory:

```bash
npm start
```

The backend is configured to use port `5000` by default.

Confirm that the console reports a successful MongoDB connection before testing database-dependent features.

### 4. Configure the Frontend

Open a second terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

The development Vite configuration proxies API requests to the backend on `http://localhost:5000`. If you change the backend port, update the proxy configuration accordingly.

### 5. Initial Application Workflow

After configuring the backend and frontend:

1. Start the backend and confirm its database connection.
2. Register a business through the registration page.
3. Sign in with the registered account.
4. Create products and suppliers.
5. Create a purchase record and receive it.
6. Verify the updated quantities in Inventory.
7. Open the business storefront and place an order.
8. Verify that stock moves from Available to Reserved.
9. Test payment success, payment failure, cancellation, and expiry using the configured test environment.
10. Check that stock movements and order statuses match each transition.

The initial registration flow creates a business and its first Business Admin. Follow the existing authentication and seed configuration for administrative access.

## API Overview

The backend exposes versioned REST endpoints under `/api/v1`.

| Area | Endpoint examples |
|---|---|
| Authentication | `/api/v1/auth/register`, `/api/v1/auth/login` |
| Products | `/api/v1/business/products` |
| Suppliers | `/api/v1/business/suppliers` |
| Purchases | `/api/v1/business/purchases` |
| Inventory | `/api/v1/business/inventory` |
| Stock movements | `/api/v1/business/inventory-movements` |
| Business orders | `/api/v1/business/orders` |
| Dashboard insights | `/api/v1/business/insights/stock-overview` |
| Sales insights | `/api/v1/business/insights/sales` |
| Top-selling products | `/api/v1/business/insights/top-selling` |
| Public storefront | `/api/v1/storefront/:slug` |
| Payment webhooks | `/api/v1/webhooks/razorpay` |

Payment creation, verification, cancellation, purchase receiving, and other operations have dedicated endpoints. Consult the backend route files for their exact request formats and permissions.

## Security and Data Integrity

StockFlow uses several controls to protect business data and inventory:

- JWT authentication for protected endpoints.
- Role-based authorization.
- Tenant identity derived from the authenticated session rather than trusted from client input.
- Tenant-scoped database access.
- Password hashing.
- MongoDB transactions for critical inventory and order operations.
- Idempotent handling of supported payment events.
- Restricted payment summaries that avoid exposing credentials and raw webhook details.
- Environment variables for secrets and external service credentials.

These controls should be verified through testing and deployment configuration; they do not remove the need for secure secret management and production monitoring.

## Testing

The repository contains phase-specific test scripts used during development. Run the relevant scripts from the directory containing each script and use the commands defined in the corresponding `package.json`.

Before a release, verify:

- Registration and login.
- Role-based access and cross-tenant isolation.
- Product and supplier permissions.
- Purchase receiving and stock movements.
- Order reservation and cancellation.
- Payment verification and duplicate webhook handling.
- Reservation expiry and late payment handling.
- Low-stock alert behavior.
- Dashboard and analytics responses.
- Frontend production build.
- Actual Razorpay and SMTP behavior with valid test credentials.

A passing local test does not by itself prove that production payments, email delivery, or deployment configuration are working.

## Current Scope

StockFlow focuses on inventory operations, supplier and purchase management, order reservations, payment handling, and business insights.

The current scope excludes:

- AI/ML features.
- Customer accounts and customer login.
- Multi-warehouse management.
- CRM functionality.
- Subscription billing.
- Automatic refunds.
- A separate Reports module.
- Redis or a queue-based reservation system.

## Deployment

The intended deployment setup is:

- **Frontend:** Vercel.
- **Backend:** Render.
- **Database:** MongoDB Atlas.

Before deploying, configure the required environment variables in the hosting platforms, allow the deployed backend to connect to MongoDB Atlas, configure production CORS settings, and use valid production secrets.

Payment webhooks must point to the deployed backend and use the correct tenant-specific webhook credentials. SMTP delivery and payment processing should be tested independently before treating the application as production-ready.

## Project Documentation

`PROJECT_DOC.md` contains the detailed implementation record and phase-by-phase project decisions. Refer to it alongside the source code when checking the current implementation.

## License

No license has been specified yet. Add a license only after deciding how the project may be used, modified, and distributed.
