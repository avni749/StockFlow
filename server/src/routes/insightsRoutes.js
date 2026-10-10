const express = require('express');
const { getTopSellingProducts, getSalesAnalytics, getStockOverview } = require('../controllers/insightsController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

router.get('/top-selling', authorize(ROLES.BUSINESS_ADMIN), getTopSellingProducts);
router.get('/sales', authorize(ROLES.BUSINESS_ADMIN), getSalesAnalytics);
router.get('/stock-overview', authorize(ROLES.BUSINESS_ADMIN, ROLES.STAFF), getStockOverview);

module.exports = router;
