const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const Order = require('../models/Order');
const InventoryState = require('../models/InventoryState');
const InventoryMovement = require('../models/InventoryMovement');

const getStorefront = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug, status: 'ACTIVE' });
    if (!tenant) {
      res.status(404);
      throw new Error('Storefront not found');
    }
    res.json({ storefront: { id: tenant._id, name: tenant.name, slug: tenant.slug } });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug, status: 'ACTIVE' });
    if (!tenant) {
      res.status(404);
      throw new Error('Storefront not found');
    }
    const products = await Product.find({ tenantId: tenant._id, status: 'ACTIVE' });
    res.json({
      products: products.map(p => ({
        id: p._id, name: p.name, SKU: p.SKU, description: p.description, sellingPrice: p.sellingPrice, category: p.category, image: p.image
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug, status: 'ACTIVE' });
    if (!tenant) {
      res.status(404);
      throw new Error('Storefront not found');
    }
    const product = await Product.findOne({ _id: req.params.productId, tenantId: tenant._id, status: 'ACTIVE' });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json({
      product: {
        id: product._id, name: product.name, SKU: product.SKU, description: product.description, sellingPrice: product.sellingPrice, category: product.category, image: product.image
      }
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const tenant = await Tenant.findOne({ slug: req.params.slug, status: 'ACTIVE' }).session(session);
    if (!tenant) {
      res.status(404);
      throw new Error('Storefront not found');
    }

    const { customerName, customerEmail, customerPhone, deliveryAddress, items } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      res.status(400);
      throw new Error('Missing required customer details');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Order must contain items');
    }

    // Merge duplicate productIds to prevent InventoryState read/overwrite race conditions
    const mergedItemsMap = new Map();
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        res.status(400);
        throw new Error('Invalid item data');
      }
      mergedItemsMap.set(
        item.productId,
        (mergedItemsMap.get(item.productId) || 0) + item.quantity
      );
    }
    const uniqueItems = Array.from(mergedItemsMap.entries()).map(([productId, quantity]) => ({ productId, quantity }));

    let totalAmount = 0;
    const orderItems = [];
    const movements = [];
    const inventoryUpdates = [];

    for (const item of uniqueItems) {
      const product = await Product.findOne({ _id: item.productId, tenantId: tenant._id, status: 'ACTIVE' }).session(session);
      if (!product) {
        res.status(404);
        throw new Error(`Product ${item.productId} not found or inactive`);
      }

      let invState = await InventoryState.findOne({ tenantId: tenant._id, productId: item.productId }).session(session);
      if (!invState || invState.available < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      // Decrement available, increment reserved
      invState.available -= item.quantity;
      invState.reserved += item.quantity;
      inventoryUpdates.push(invState);

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        sellingPrice: product.sellingPrice
      });

      totalAmount += (product.sellingPrice * item.quantity);

      movements.push({
        tenantId: tenant._id,
        productId: product._id,
        quantity: item.quantity,
        type: 'ORDER_RESERVED'
      });
    }

    // Save states
    for (const state of inventoryUpdates) {
      await state.save({ session });
    }

    // Determine expiry
    const duration = tenant.reservationDurationMinutes || 15;
    const expiresAt = new Date(Date.now() + duration * 60000);

    const order = await Order.create([{
      tenantId: tenant._id,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      items: orderItems,
      totalAmount,
      status: 'PENDING_PAYMENT',
      orderSource: 'STOREFRONT',
      expiresAt
    }], { session });

    // Link movements to order
    for (let m of movements) {
      m.reference = order[0]._id;
    }
    await InventoryMovement.insertMany(movements, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      order: {
        id: order[0]._id,
        customerName: order[0].customerName,
        customerEmail: order[0].customerEmail,
        customerPhone: order[0].customerPhone,
        deliveryAddress: order[0].deliveryAddress,
        items: order[0].items.map(i => ({
          productId: i.productId, quantity: i.quantity, sellingPrice: i.sellingPrice
        })),
        totalAmount: order[0].totalAmount,
        status: order[0].status,
        expiresAt: order[0].expiresAt,
        orderSource: order[0].orderSource,
        createdAt: order[0].createdAt
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};



const crypto = require('crypto');
const Razorpay = require('razorpay');
const PaymentTransaction = require('../models/PaymentTransaction');

const cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const tenant = await Tenant.findOne({ slug: req.params.slug, status: 'ACTIVE' }).session(session);
    if (!tenant) {
      res.status(404);
      throw new Error('Storefront not found');
    }

    const order = await Order.findOne({ _id: req.params.orderId, tenantId: tenant._id }).session(session);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.status === 'CANCELLED') {
      await session.abortTransaction();
      session.endSession();
      return res.json({ message: 'Order already cancelled', orderId: order._id });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      res.status(400);
      throw new Error('Only PENDING_PAYMENT orders can be cancelled');
    }

    order.status = 'CANCELLED';
    await order.save({ session });

    const movements = [];
    for (const item of order.items) {
      const invState = await InventoryState.findOne({ tenantId: tenant._id, productId: item.productId }).session(session);
      if (invState) {
        const releaseQty = Math.min(invState.reserved, item.quantity);
        invState.reserved -= releaseQty;
        invState.available += releaseQty;
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

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Order cancelled successfully', orderId: order._id, status: 'CANCELLED' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug, status: 'ACTIVE' });
    if (!tenant) {
      res.status(404);
      throw new Error('Storefront not found');
    }

    if (!tenant.razorpayKeyId || !tenant.razorpayKeySecret) {
      res.status(400);
      throw new Error('Razorpay is not configured for this business');
    }

    const order = await Order.findOne({ _id: req.params.orderId, tenantId: tenant._id });
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      res.status(400);
      throw new Error('Order is not eligible for payment');
    }

    if (Date.now() > order.expiresAt.getTime()) {
      res.status(400);
      throw new Error('Reservation has expired');
    }

    const existingTx = await PaymentTransaction.findOne({ orderId: order._id, status: 'CREATED' });
    let razorpayOrderId;

    if (existingTx) {
      razorpayOrderId = existingTx.razorpayOrderId;
    } else {
      const rzp = new Razorpay({
        key_id: tenant.razorpayKeyId,
        key_secret: tenant.razorpayKeySecret
      });

      const rzpOrder = await rzp.orders.create({
        amount: Math.round(order.totalAmount * 100), // convert to paise
        currency: 'INR',
        receipt: order._id.toString()
      });

      razorpayOrderId = rzpOrder.id;

      await PaymentTransaction.create({
        tenantId: tenant._id,
        orderId: order._id,
        razorpayOrderId: rzpOrder.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'CREATED'
      });
    }

    res.json({
      keyId: tenant.razorpayKeyId,
      razorpayOrderId,
      amount: order.totalAmount,
      currency: 'INR',
      orderId: order._id
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const tenant = await Tenant.findOne({ slug: req.params.slug, status: 'ACTIVE' }).session(session);
    if (!tenant) {
      res.status(404);
      throw new Error('Storefront not found');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400);
      throw new Error('Missing payment verification details');
    }

    const expectedSignature = crypto.createHmac('sha256', tenant.razorpayKeySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400);
      throw new Error('Invalid payment signature');
    }

    const tx = await PaymentTransaction.findOne({ razorpayOrderId: razorpay_order_id, tenantId: tenant._id }).session(session);
    if (!tx) {
      res.status(404);
      throw new Error('Payment transaction not found');
    }

    if (tx.status === 'SUCCESS' || tx.status === 'MANUAL_RESOLUTION') {
      await session.abortTransaction();
      session.endSession();
      return res.json({ message: 'Payment already processed', status: tx.status });
    }

    const order = await Order.findOne({ _id: tx.orderId, tenantId: tenant._id }).session(session);
    
    // Check if late or cancelled
    if (!order || order.status !== 'PENDING_PAYMENT' || Date.now() > order.expiresAt.getTime()) {
      tx.status = 'MANUAL_RESOLUTION';
      tx.razorpayPaymentId = razorpay_payment_id;
      tx.events.push({ eventType: 'PAYMENT_RECEIVED_LATE_OR_INVALID', payload: req.body });
      await tx.save({ session });

      await session.commitTransaction();
      session.endSession();
      return res.json({ message: 'Payment received but requires manual resolution (late or invalid order state)', status: 'MANUAL_RESOLUTION' });
    }

    // Valid and timely payment
    order.status = 'PAID';
    await order.save({ session });

    tx.status = 'SUCCESS';
    tx.razorpayPaymentId = razorpay_payment_id;
    tx.events.push({ eventType: 'PAYMENT_VERIFIED', payload: req.body });
    await tx.save({ session });

    const movements = [];
    for (const item of order.items) {
      const invState = await InventoryState.findOne({ tenantId: tenant._id, productId: item.productId }).session(session);
      if (invState) {
        const consumeQty = Math.min(invState.reserved, item.quantity);
        invState.reserved -= consumeQty;
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

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Payment successful', orderId: order._id, status: 'PAID' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

module.exports = {
  getStorefront,
  getProducts,
  getProduct,
  createOrder,
  cancelOrder,
  createPayment,
  verifyPayment
};
