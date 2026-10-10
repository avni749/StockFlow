const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  status: { type: String, enum: ['ACTIVE', 'RESOLVED'], default: 'ACTIVE' },
  thresholdAtAlert: { type: Number, required: true },
  stockAtAlert: { type: Number, required: true },
  resolvedAt: { type: Date }
}, { timestamps: true });

// Used to quickly find active alerts for a product
alertSchema.index({ tenantId: 1, productId: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
