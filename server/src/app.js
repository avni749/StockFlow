const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const adminRoutes = require('./routes/adminRoutes');
const businessRoutes = require('./routes/businessRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const inventoryMovementRoutes = require('./routes/inventoryMovementRoutes');
const storefrontRoutes = require('./routes/storefrontRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Routes
app.use('/api/v1/storefront/:slug', storefrontRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/business/products', productRoutes);
app.use('/api/v1/business/suppliers', supplierRoutes);
app.use('/api/v1/business/purchases', purchaseRoutes);
app.use('/api/v1/business/inventory-movements', inventoryMovementRoutes);
app.use('/api/v1/business/inventory', inventoryRoutes);
app.use('/api/v1/business/insights', insightsRoutes);
app.use('/api/v1/business/orders', orderRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/test', testRoutes); // TEMPORARY ROUTE

// Root Health/Status Endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: "StockFlow API is running" });
});

// Generic error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
