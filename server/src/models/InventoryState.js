const mongoose = require('mongoose');

const inventoryStateSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  available: { type: Number, default: 0, min: 0 },
  reserved: { type: Number, default: 0, min: 0 },
  sold: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

inventoryStateSchema.index({ tenantId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('InventoryState', inventoryStateSchema);
