const express = require('express');
const { getProducts, createProduct, getProduct, updateProduct, deactivateProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), getProducts)
  .post(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), createProduct);

router.route('/:productId')
  .get(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), getProduct)
  .patch(authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), updateProduct);

router.patch('/:productId/deactivate', authorize(ROLES.BUSINESS_ADMIN), deactivateProduct);

module.exports = router;
