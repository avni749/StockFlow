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

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/business/products', productRoutes);
app.use('/api/v1/business/suppliers', supplierRoutes);
app.use('/api/v1/business/purchases', purchaseRoutes);
app.use('/api/v1/business/inventory-movements', inventoryMovementRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/test', testRoutes); // TEMPORARY ROUTE

// Generic error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
