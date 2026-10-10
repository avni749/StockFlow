const InventoryState = require('../models/InventoryState');

const getInventory = async (req, res, next) => {
  try {
    const states = await InventoryState.find({ tenantId: req.user.tenantId })
      .populate('productId', 'name SKU status')
      .sort({ updatedAt: -1 });

    const inventory = states.map(state => ({
      id: state._id,
      product: state.productId ? {
        id: state.productId._id,
        name: state.productId.name,
        SKU: state.productId.SKU,
        status: state.productId.status
      } : null,
      available: state.available,
      reserved: state.reserved,
      sold: state.sold,
      total: state.available + state.reserved + state.sold,
      updatedAt: state.updatedAt
    }));

    res.json({ inventory });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory
};
