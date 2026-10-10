const express = require('express');
const { getOrders, getOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF));

router.route('/')
  .get(getOrders);

router.route('/:orderId')
  .get(getOrder);

module.exports = router;
