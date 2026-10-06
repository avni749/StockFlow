# StockFlow Project Documentation

## Phase 1 Implementation (Project Foundation & Security)

### What was implemented
- **Project Structure**: Initialized the fixed backend folder structure (`server/src/controllers`, `middlewares`, `models`, `routes`, etc.).
- **Dependencies**: Installed only Phase 1 requirements (`express`, `mongoose`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`).
- **Express Server**: Configured basic server (`app.js`), global error handlers, and boot script (`index.js`).
- **Database Connection**: Configured MongoDB Atlas connection logic in `config/db.js` to use `MONGO_URI` from `.env`.
- **Tenant & User Models**: 
  - `Tenant` model handles business data and the `businessWideDefaultLowStockThreshold`.
  - `User` model assigns roles (`SUPER_ADMIN`, `BUSINESS_ADMIN`, `STAFF`), links to `tenantId` (except for Super Admins), and encrypts passwords using `bcryptjs`.
- **Authentication Controllers**: 
  - `registerBusiness` securely creates a Tenant and an initial `BUSINESS_ADMIN` user.
  - `login` securely verifies credentials and issues a JSON Web Token.
- **Security Middlewares**: 
  - `authMiddleware.js` implements `protect` (verifies JWT and extracts user/tenant context) and `authorize` (restricts access by roles).
- **Temporary Routes**: Added `/api/v1/test/protected` and `/api/v1/test/admin-only` specifically for validating JWT and role rules.

### Verification Status
**STATUS: APPROVED (Phase 1 Complete)**

All Phase 1 tests have been executed against the live MongoDB Atlas database and passed successfully:
1. **Business Registration:** Successfully creates Tenant and links the first BUSINESS_ADMIN user.
2. **Valid Login:** Successfully issues a valid JWT containing the required context.
3. **Invalid Login:** Successfully rejects incorrect passwords.
4. **Missing/Invalid JWT:** Successfully rejects unauthenticated access (401).
5. **Valid JWT / Protected Route:** Successfully authenticates and permits access.
6. **Role Authorization:** Successfully blocks STAFF users from accessing admin-only routes (403).
7. **Tenant Protection:** Successfully enforces tenant isolation securely using the server-side JWT context (bypassing client-provided spoofs).
8. **Password Security:** Passwords are fully hashed in MongoDB using `bcrypt` and are safely excluded from API responses.
9. **Error Handling:** Invalid requests and routes return controlled JSON error structures rather than crashing the Express server.

## Phase 2 Implementation (Super Admin & Business Management)

### What was implemented
- **Super Admin Seeding**: Created server/src/seed/superAdmin.js to securely provision a Super Admin account without exposing passwords in logs. Relies on .env variables (\SUPER_ADMIN_NAME\, \SUPER_ADMIN_EMAIL\, \SUPER_ADMIN_PASSWORD\).
- **Global Tenant Suspension Enforcement**: Updated the \protect\ middleware in \uthMiddleware.js\ to universally block access for \BUSINESS_ADMIN\ and \STAFF\ users if their associated business tenant is marked as \SUSPENDED\. \SUPER_ADMIN\ explicitly bypasses this restriction.
- **Super Admin Capabilities**:
  - \GET /api/v1/admin/businesses\: View all business tenants.
  - \PATCH /api/v1/admin/businesses/:tenantId/suspend\: Suspends a business tenant.
  - \PATCH /api/v1/admin/businesses/:tenantId/reactivate\: Reactivates a suspended tenant.
- **Business Admin / Staff Management Capabilities**:
  - \GET /api/v1/business/staff\: View all \STAFF\ accounts belonging to the business.
  - \POST /api/v1/business/staff\: Securely create new \STAFF\ users directly bound to the business's \	enantId\.
  - \GET /api/v1/business/staff/:userId\: View a specific staff member.
  - \PATCH /api/v1/business/staff/:userId\: Edit a staff member's name or email.
  - \PATCH /api/v1/business/staff/:userId/suspend\: Suspend a staff member.
  - \PATCH /api/v1/business/staff/:userId/reactivate\: Reactivate a staff member.
- **Security & Constraints**: Hard-deletes are restricted; staff management endpoints enforce strict boundary checks ensuring a Business Admin can only modify \STAFF\ members within their specific \	enantId\.

### Verification Status
**STATUS: APPROVED (Phase 2 Complete)**

All Phase 2 tests were successfully executed against the live MongoDB Atlas cluster, confirming:
1. Super Admin seed completes successfully without creating duplicates.
2. Super Admin login resolves correctly to a valid JWT.
3. Super Admins can list and mutate business statuses globally.
4. Business Admins successfully manage staff strictly within their \	enantId\ isolation boundary.
5. Cross-tenant access attempts return 404 (resource not found in scope).
6. Suspended businesses lock out authenticated \BUSINESS_ADMIN\ and \STAFF\ requests (returning 403 Forbidden).
7. Phase 1 authentication and password hash protections remain fully intact.

## Phase 3 Implementation (Catalog & Supplier Management)

### What was implemented
- **Product Model**: Tenant-specific catalog entities created at `server/src/models/Product.js`. Includes exactly: `name`, `SKU`, `description`, `sellingPrice`, `category`, `image` (string URL only, no file uploads), `lowStockThreshold`, `status`, and `tenantId`.
- **Supplier Model**: Tenant-specific supplier entities created at `server/src/models/Supplier.js`. Includes exactly: `name`, `contactName`, `email`, `phone`, `address`, `status`, and `tenantId`.
- **Endpoints**:
  - `GET /api/v1/business/products`
  - `POST /api/v1/business/products`
  - `GET /api/v1/business/products/:productId`
  - `PATCH /api/v1/business/products/:productId`
  - `PATCH /api/v1/business/products/:productId/deactivate`
  - `GET /api/v1/business/suppliers`
  - `POST /api/v1/business/suppliers`
  - `GET /api/v1/business/suppliers/:supplierId`
  - `PATCH /api/v1/business/suppliers/:supplierId`
  - `PATCH /api/v1/business/suppliers/:supplierId/deactivate`
- **Role Permissions**:
  - `BUSINESS_ADMIN` can perform all operations (Create, List, View, Edit, Deactivate) on Products and Suppliers.
  - `STAFF` can perform Create, List, View, and Edit. They receive `403 Forbidden` if attempting Deactivate operations.
  - `SUPER_ADMIN` does not have access to these Phase 3 business endpoints.
- **Tenant Isolation**: 
  - All operations strictly query and mandate the `tenantId` pulled from the server-validated JWT session context (`req.user.tenantId`). Cross-tenant access requests return `404 Not Found` (effectively hiding the resource's existence from other tenants).
- **Out of Scope (Preserved Constraints)**:
  - No `InventoryMovement`, `PurchaseRecord`, or stock modifications were made.
  - No global search or pagination tools were installed.
  - The image field remains a plain text URL with no multipart upload libraries (e.g., multer) implemented.

### Verification Status
**STATUS: APPROVED (Phase 3 Complete)**

All 57 Phase 3 verification tests were successfully executed against the live MongoDB Atlas cluster, confirming:
1. Business Admins and Staff can Create, List, View, and Edit tenant-scoped Products and Suppliers.
2. Only Business Admins can Deactivate entities (Staff correctly receives 403).
3. Cross-tenant access is fully isolated and strictly denied (returning 404).
4. Stock functionality remained strictly untouched (no stock mutations triggered).
5. All Phase 1 authentication and Phase 2 Super Admin functionalities, tenant isolation logic, password hash protection, and tenant suspension safeguards continue functioning.
