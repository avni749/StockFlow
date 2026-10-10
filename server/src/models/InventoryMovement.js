const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  type: { type: String, enum: ['PURCHASE_RECEIVED', 'ORDER_RESERVED', 'ORDER_SOLD', 'ORDER_RELEASED'], required: true },
  reference: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
