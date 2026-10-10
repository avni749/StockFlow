const express = require('express');
const { getInventory } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF));

router.route('/')
  .get(getInventory);

module.exports = router;
