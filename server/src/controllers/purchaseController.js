const mongoose = require('mongoose');
const PurchaseRecord = require('../models/PurchaseRecord');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const InventoryState = require('../models/InventoryState');
const InventoryMovement = require('../models/InventoryMovement');

const mapPurchase = (p) => ({
  id: p._id,
  supplierId: p.supplierId,
  status: p.status,
  items: p.items.map(i => ({
    id: i._id,
    productId: i.productId,
    quantity: i.quantity,
    purchasePrice: i.purchasePrice
  })),
  purchaseDate: p.purchaseDate,
  tenantId: p.tenantId,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt
});

const getPurchases = async (req, res, next) => {
  try {
    const purchases = await PurchaseRecord.find({ tenantId: req.user.tenantId });
    res.json({ purchases: purchases.map(mapPurchase) });
  } catch (error) {
    next(error);
  }
};

const getPurchase = async (req, res, next) => {
  try {
    const purchase = await PurchaseRecord.findOne({ _id: req.params.purchaseId, tenantId: req.user.tenantId });
    if (!purchase) {
      res.status(404);
      throw new Error('Purchase not found');
    }
    res.json({ purchase: mapPurchase(purchase) });
  } catch (error) {
    next(error);
  }
};

const createPurchase = async (req, res, next) => {
  try {
    const { supplierId, items } = req.body;
    
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Please provide supplierId and items');
    }

    // Validate supplier
    const supplier = await Supplier.findOne({ _id: supplierId, tenantId: req.user.tenantId });
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    if (supplier.status === 'INACTIVE') {
      res.status(400);
      throw new Error('Cannot use an INACTIVE supplier');
    }

    // Validate products
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0 || item.purchasePrice === undefined || item.purchasePrice < 0) {
        res.status(400);
        throw new Error('Invalid item data');
      }
      const product = await Product.findOne({ _id: item.productId, tenantId: req.user.tenantId });
      if (!product) {
        res.status(404);
        throw new Error(`Product ${item.productId} not found`);
      }
      if (product.status === 'INACTIVE') {
        res.status(400);
        throw new Error(`Cannot use INACTIVE product ${item.productId}`);
      }
    }

    const purchase = await PurchaseRecord.create({
      tenantId: req.user.tenantId,
      supplierId,
      items
    });

    res.status(201).json({ purchase: mapPurchase(purchase) });
  } catch (error) {
    next(error);
  }
};

const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await PurchaseRecord.findOne({ _id: req.params.purchaseId, tenantId: req.user.tenantId });
    if (!purchase) {
      res.status(404);
      throw new Error('Purchase not found');
    }
    
    if (purchase.status !== 'PENDING') {
      res.status(400);
      throw new Error('Only PENDING purchases can be updated');
    }

    const { supplierId, items } = req.body;
    
    if (supplierId) {
      const supplier = await Supplier.findOne({ _id: supplierId, tenantId: req.user.tenantId });
      if (!supplier || supplier.status === 'INACTIVE') {
        res.status(400);
        throw new Error('Invalid or INACTIVE supplier');
      }
      purchase.supplierId = supplierId;
    }

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, tenantId: req.user.tenantId });
        if (!product || product.status === 'INACTIVE') {
          res.status(400);
          throw new Error('Invalid or INACTIVE product');
        }
      }
      purchase.items = items;
    }

    await purchase.save();
    res.json({ purchase: mapPurchase(purchase) });
  } catch(error) {
    next(error);
  }
};

const receivePurchase = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const purchase = await PurchaseRecord.findOne({ _id: req.params.purchaseId, tenantId: req.user.tenantId }).session(session);
    
    if (!purchase) {
      res.status(404);
      throw new Error('Purchase not found');
    }
    
    if (purchase.status === 'RECEIVED') {
      res.status(400);
      throw new Error('Purchase has already been received');
    }

    purchase.status = 'RECEIVED';
    await purchase.save({ session });

    for (const item of purchase.items) {
      const product = await Product.findOne({ _id: item.productId, tenantId: req.user.tenantId }).session(session);
      if (!product) {
        res.status(400);
        throw new Error(`Product ${item.productId} not found during receive`);
      }

      let state = await InventoryState.findOne({ tenantId: req.user.tenantId, productId: item.productId }).session(session);
      if (!state) {
        state = new InventoryState({
          tenantId: req.user.tenantId,
          productId: item.productId,
          available: item.quantity,
          reserved: 0,
          sold: 0
        });
      } else {
        state.available += item.quantity;
      }
      await state.save({ session });

      await InventoryMovement.create([{
        tenantId: req.user.tenantId,
        productId: item.productId,
        quantity: item.quantity,
        type: 'PURCHASE_RECEIVED',
        reference: purchase._id
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ purchase: mapPurchase(purchase) });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

module.exports = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  receivePurchase
};
