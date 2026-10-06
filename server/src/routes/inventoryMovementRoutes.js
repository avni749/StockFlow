const express = require('express');
const { getMovements, getMovement } = require('../controllers/inventoryMovementController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF));

router.route('/')
  .get(getMovements);

router.route('/:movementId')
  .get(getMovement);

module.exports = router;
