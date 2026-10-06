const express = require('express');
const { getBusinesses, suspendBusiness, reactivateBusiness } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get('/businesses', getBusinesses);
router.patch('/businesses/:tenantId/suspend', suspendBusiness);
router.patch('/businesses/:tenantId/reactivate', reactivateBusiness);

module.exports = router;
