const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  sellingPrice: { type: Number, required: true, min: 0 }
});

const orderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED'], default: 'PENDING_PAYMENT' },
  orderSource: { type: String, enum: ['STOREFRONT'], default: 'STOREFRONT' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
