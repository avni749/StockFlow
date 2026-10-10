const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');

const ALLOWED_STATUSES = ['PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED'];

const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { tenantId: req.user.tenantId };

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        res.status(400);
        throw new Error('Invalid status filter provided');
      }
      query.status = status;
    }

    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('items.productId', 'name SKU');

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      tenantId: req.user.tenantId
    }).populate('items.productId', 'name SKU');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const paymentTx = await PaymentTransaction.findOne({ orderId: order._id });

    let paymentSummary = null;
    if (paymentTx) {
      paymentSummary = {
        status: paymentTx.status,
        razorpayOrderId: paymentTx.razorpayOrderId,
        razorpayPaymentId: paymentTx.razorpayPaymentId || null,
        amount: paymentTx.amount,
        currency: paymentTx.currency
      };
    }

    const responsePayload = {
      _id: order._id,
      tenantId: order.tenantId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      orderSource: order.orderSource,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      payment: paymentSummary
    };

    res.json(responsePayload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrder
};
