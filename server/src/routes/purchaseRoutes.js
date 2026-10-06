const express = require('express');
const { getPurchases, getPurchase, createPurchase, updatePurchase, receivePurchase } = require('../controllers/purchaseController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF));

router.route('/')
  .get(getPurchases)
  .post(createPurchase);

router.route('/:purchaseId')
  .get(getPurchase)
  .patch(updatePurchase);

router.post('/:purchaseId/receive', receivePurchase);

module.exports = router;
