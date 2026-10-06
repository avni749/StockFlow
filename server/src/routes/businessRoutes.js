const express = require('express');
const { getStaffList, createStaff, getStaff, updateStaff, suspendStaff, reactivateStaff } = require('../controllers/businessController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.BUSINESS_ADMIN));

router.route('/staff')
  .get(getStaffList)
  .post(createStaff);

router.route('/staff/:userId')
  .get(getStaff)
  .patch(updateStaff);

router.patch('/staff/:userId/suspend', suspendStaff);
router.patch('/staff/:userId/reactivate', reactivateStaff);

module.exports = router;
