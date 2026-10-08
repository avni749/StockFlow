import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import StorefrontLayout from './layouts/StorefrontLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Landing from './pages/Landing';
import DashboardHome from './pages/dashboard/DashboardHome';
import ProductList from './pages/products/ProductList';
import ProductDetails from './pages/products/ProductDetails';
import ProductCreate from './pages/products/ProductCreate';
import ProductEdit from './pages/products/ProductEdit';
import SupplierList from './pages/suppliers/SupplierList';
import SupplierDetails from './pages/suppliers/SupplierDetails';
import SupplierCreate from './pages/suppliers/SupplierCreate';
import SupplierEdit from './pages/suppliers/SupplierEdit';

import InventoryOverview from './pages/inventory/InventoryOverview';
import PurchaseList from './pages/purchases/PurchaseList';
import PurchaseCreate from './pages/purchases/PurchaseCreate';
import PurchaseDetails from './pages/purchases/PurchaseDetails';
import MovementList from './pages/inventory/MovementList';
import MovementDetails from './pages/inventory/MovementDetails';

import OrderList from './pages/orders/OrderList';
import OrderDetails from './pages/orders/OrderDetails';

import AnalyticsHome from './pages/analytics/AnalyticsHome';

import SettingsHome from './pages/settings/SettingsHome';
import StaffCreate from './pages/settings/StaffCreate';
import StaffEdit from './pages/settings/StaffEdit';

import StorefrontCatalog from './pages/storefront/StorefrontCatalog';
import StorefrontCart from './pages/storefront/StorefrontCart';
import StorefrontCheckout from './pages/storefront/StorefrontCheckout';
import StorefrontOrderStatus from './pages/storefront/StorefrontOrderStatus';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Dashboard/Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductCreate />} />
          <Route path="/products/:productId" element={<ProductDetails />} />
          <Route path="/products/:productId/edit" element={<ProductEdit />} />

          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/suppliers/new" element={<SupplierCreate />} />
          <Route path="/suppliers/:supplierId" element={<SupplierDetails />} />
          <Route path="/suppliers/:supplierId/edit" element={<SupplierEdit />} />

          <Route path="/inventory" element={<InventoryOverview />} />
          <Route path="/purchases" element={<PurchaseList />} />
          <Route path="/purchases/new" element={<PurchaseCreate />} />
          <Route path="/purchases/:purchaseId" element={<PurchaseDetails />} />
          <Route path="/inventory-movements" element={<MovementList />} />
          <Route path="/inventory-movements/:movementId" element={<MovementDetails />} />

          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />

          <Route path="/analytics" element={<AnalyticsHome />} />

          <Route path="/settings" element={<SettingsHome />} />
          <Route path="/settings/staff/new" element={<StaffCreate />} />
          <Route path="/settings/staff/:staffId/edit" element={<StaffEdit />} />
        </Route>
      </Route>

      {/* Public Storefront Routes */}
      <Route path="/:slug" element={<StorefrontLayout />}>
        <Route index element={<StorefrontCatalog />} />
        <Route path="cart" element={<StorefrontCart />} />
        <Route path="checkout" element={<StorefrontCheckout />} />
        <Route path="order-status/:orderId" element={<StorefrontOrderStatus />} />
      </Route>

      {/* Default fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
