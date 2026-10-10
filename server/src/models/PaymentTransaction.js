const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['CREATED', 'SUCCESS', 'FAILED', 'MANUAL_RESOLUTION'], default: 'CREATED' },
  events: [{
    eventType: String,
    payload: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// For idempotency and resolving webhooks safely
paymentTransactionSchema.index({ razorpayOrderId: 1 });
paymentTransactionSchema.index({ razorpayPaymentId: 1 });
paymentTransactionSchema.index({ orderId: 1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
