const InventoryMovement = require('../models/InventoryMovement');

const mapMovement = (m) => ({
  id: m._id,
  productId: m.productId,
  quantity: m.quantity,
  type: m.type,
  reference: m.reference,
  tenantId: m.tenantId,
  createdAt: m.createdAt
});

const getMovements = async (req, res, next) => {
  try {
    const movements = await InventoryMovement.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.json({ inventoryMovements: movements.map(mapMovement) });
  } catch (error) {
    next(error);
  }
};

const getMovement = async (req, res, next) => {
  try {
    const movement = await InventoryMovement.findOne({ _id: req.params.movementId, tenantId: req.user.tenantId });
    if (!movement) {
      res.status(404);
      throw new Error('Movement not found');
    }
    res.json({ inventoryMovement: mapMovement(movement) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovements,
  getMovement
};
