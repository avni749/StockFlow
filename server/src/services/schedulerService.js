const mongoose = require('mongoose');
const Order = require('../models/Order');
const InventoryState = require('../models/InventoryState');
const InventoryMovement = require('../models/InventoryMovement');
const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const User = require('../models/User');
const Alert = require('../models/Alert');
const emailService = require('./emailService');

const processLowStockAlerts = async () => {
  try {
    const inventoryStates = await InventoryState.find().populate('tenantId').populate('productId');

    for (const state of inventoryStates) {
      if (!state.tenantId || !state.productId) continue;
      
      const tenant = state.tenantId;
      const product = state.productId;

      if (tenant.status !== 'ACTIVE' || product.status !== 'ACTIVE') continue;

      const threshold = product.lowStockThreshold != null 
        ? product.lowStockThreshold 
        : tenant.businessWideDefaultLowStockThreshold;

      const activeAlert = await Alert.findOne({ 
        tenantId: tenant._id, 
        productId: product._id, 
        status: 'ACTIVE' 
      });

      if (state.available < threshold) {
        if (!activeAlert) {
          await Alert.create({
            tenantId: tenant._id,
            productId: product._id,
            status: 'ACTIVE',
            thresholdAtAlert: threshold,
            stockAtAlert: state.available
          });

          const admins = await User.find({
            tenantId: tenant._id,
            role: 'BUSINESS_ADMIN',
            status: 'ACTIVE'
          });

          if (admins.length > 0) {
            const emails = admins.map(a => a.email);
            await emailService.sendLowStockEmail(emails, product.name, state.available, threshold);
          }
        }
      } else {
        if (activeAlert) {
          activeAlert.status = 'RESOLVED';
          activeAlert.resolvedAt = new Date();
          await activeAlert.save();
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler Error] Failed to process low stock alerts:', err.message);
  }
};

const processExpiredReservations = async () => {
  try {
    const expiredOrders = await Order.find({
      status: 'PENDING_PAYMENT',
      expiresAt: { $lte: new Date() }
    });

    for (const order of expiredOrders) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        // Use findOneAndUpdate with status condition to handle concurrency safely
        const updatedOrder = await Order.findOneAndUpdate(
          { _id: order._id, status: 'PENDING_PAYMENT' },
          { status: 'EXPIRED' },
          { session, returnDocument: 'after' }
        );

        // If updatedOrder is null, another process already expired/paid/cancelled it
        if (!updatedOrder) {
          await session.abortTransaction();
          session.endSession();
          continue;
        }

        const movements = [];
        for (const item of order.items) {
          const invState = await InventoryState.findOne({ 
            tenantId: order.tenantId, 
            productId: item.productId 
          }).session(session);

          if (invState) {
            const releaseQty = Math.min(invState.reserved, item.quantity);
            invState.reserved -= releaseQty;
            invState.available += releaseQty;
            await invState.save({ session });
          }

          movements.push({
            tenantId: order.tenantId,
            productId: item.productId,
            quantity: item.quantity,
            type: 'ORDER_RELEASED',
            reference: order._id
          });
        }

        if (movements.length > 0) {
          await InventoryMovement.insertMany(movements, { session });
        }

        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(`[Scheduler Error] Failed to process expiry for order ${order._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler Error] Failed to fetch expired orders:', err.message);
  }
};

const startScheduler = () => {
  console.log('Starting StockFlow Schedulers (Expiry & Alerts)...');
  
  // Execute immediately upon DB connection
  processExpiredReservations();
  processLowStockAlerts();

  // Execute every 60 seconds
  setInterval(() => {
    processExpiredReservations();
    processLowStockAlerts();
  }, 60000);
};

module.exports = {
  processExpiredReservations,
  processLowStockAlerts,
  startScheduler
};
