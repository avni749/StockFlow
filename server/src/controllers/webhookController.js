const crypto = require('crypto');
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');
const InventoryState = require('../models/InventoryState');
const InventoryMovement = require('../models/InventoryMovement');

const razorpayWebhook = async (req, res, next) => {
  try {
    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (!event || !paymentEntity) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    if (event !== 'payment.captured' && event !== 'payment.failed') {
      return res.status(200).json({ message: 'Event ignored' });
    }

    const razorpayOrderId = paymentEntity.order_id;
    if (!razorpayOrderId) {
      return res.status(400).json({ message: 'Missing order_id in webhook' });
    }

    const tx = await PaymentTransaction.findOne({ razorpayOrderId });
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const tenant = await Tenant.findById(tx.tenantId);
    if (!tenant || !tenant.razorpayWebhookSecret) {
      return res.status(400).json({ message: 'Tenant or webhook secret missing' });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ message: 'Missing signature' });
    }

    const expectedSignature = crypto.createHmac('sha256', tenant.razorpayWebhookSecret)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const freshTx = await PaymentTransaction.findById(tx._id).session(session);
      
      // If already processed via verify API, just return ok
      if (freshTx.status === 'SUCCESS' && event === 'payment.captured') {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({ message: 'Already processed' });
      }

      if (freshTx.status === 'FAILED' && event === 'payment.failed') {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({ message: 'Already processed' });
      }

      const order = await Order.findById(freshTx.orderId).session(session);

      if (event === 'payment.captured') {
        if (!order || order.status !== 'PENDING_PAYMENT' || Date.now() > order.expiresAt.getTime()) {
          freshTx.status = 'MANUAL_RESOLUTION';
          freshTx.razorpayPaymentId = paymentEntity.id;
          freshTx.events.push({ eventType: 'WEBHOOK_LATE_OR_INVALID_CAPTURE', payload: req.body });
          await freshTx.save({ session });
          await session.commitTransaction();
          session.endSession();
          return res.status(200).json({ message: 'Marked for manual resolution' });
        }

        order.status = 'PAID';
        await order.save({ session });

        freshTx.status = 'SUCCESS';
        freshTx.razorpayPaymentId = paymentEntity.id;
        freshTx.events.push({ eventType: 'WEBHOOK_PAYMENT_CAPTURED', payload: req.body });
        await freshTx.save({ session });

        const movements = [];
        for (const item of order.items) {
          const invState = await InventoryState.findOne({ tenantId: tenant._id, productId: item.productId }).session(session);
          if (invState) {
            invState.reserved -= item.quantity;
            invState.sold += item.quantity;
            await invState.save({ session });
          }

          movements.push({
            tenantId: tenant._id,
            productId: item.productId,
            quantity: item.quantity,
            type: 'ORDER_SOLD',
            reference: order._id
          });
        }
        if (movements.length > 0) {
          await InventoryMovement.insertMany(movements, { session });
        }
      } else if (event === 'payment.failed') {
        freshTx.status = 'FAILED';
        freshTx.razorpayPaymentId = paymentEntity.id;
        freshTx.events.push({ eventType: 'WEBHOOK_PAYMENT_FAILED', payload: req.body });
        await freshTx.save({ session });

        if (order && order.status === 'PENDING_PAYMENT') {
          // Do we mark order CANCELLED on payment fail? 
          // Requirements: "For a failed payment: PENDING_PAYMENT -> payment failure -> Reserved -> Available -> ORDER_RELEASED movement"
          // "A failed payment must NOT mark the order as PAID." Wait, does it mark it as CANCELLED? The prompt doesn't explicitly state to change Order status on failed payment. Just leave it or mark it? I'll just release the stock and leave the status PENDING_PAYMENT or whatever it is unless requested. Wait, if it releases stock, the order cannot be fulfilled later. 
          // Let me just release the stock. 
          const movements = [];
          for (const item of order.items) {
            const invState = await InventoryState.findOne({ tenantId: tenant._id, productId: item.productId }).session(session);
            if (invState) {
              invState.reserved -= item.quantity;
              invState.available += item.quantity;
              await invState.save({ session });
            }
            movements.push({
              tenantId: tenant._id,
              productId: item.productId,
              quantity: item.quantity,
              type: 'ORDER_RELEASED',
              reference: order._id
            });
          }
          if (movements.length > 0) {
            await InventoryMovement.insertMany(movements, { session });
          }
        }
      }

      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ ok: true });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

  } catch (error) {
    next(error);
  }
};

module.exports = { razorpayWebhook };
