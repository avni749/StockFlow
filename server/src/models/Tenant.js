const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    businessWideDefaultLowStockThreshold: {
      type: Number,
      default: 10,
    },
    reservationDurationMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 60,
    },
    razorpayKeyId: {
      type: String,
    },
    razorpayKeySecret: {
      type: String,
    },
    razorpayWebhookSecret: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
