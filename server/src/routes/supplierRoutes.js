const express = require('express');
const { getSuppliers, createSupplier, getSupplier, updateSupplier, deactivateSupplier } = require('../controllers/supplierController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), getSuppliers)
  .post(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), createSupplier);

router.route('/:supplierId')
  .get(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), getSupplier)
  .patch(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), updateSupplier);

router.patch('/:supplierId/deactivate', authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), deactivateSupplier);

module.exports = router;
