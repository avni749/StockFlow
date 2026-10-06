const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  purchasePrice: { type: Number, required: true, min: 0 }
});

const purchaseRecordSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  status: { type: String, enum: ['PENDING', 'RECEIVED'], default: 'PENDING' },
  items: [purchaseItemSchema],
  purchaseDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseRecord', purchaseRecordSchema);
