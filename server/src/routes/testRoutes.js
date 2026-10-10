const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants');
const router = express.Router();

// Temporary route for Phase 1 testing only.
// Validates JWT authentication and exposes tenant protection context.
router.get('/protected', protect, (req, res) => {
  res.json({
    message: 'JWT is valid',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
    tenantId: req.user.tenantId, // Tenant isolation context
  });
});

// Temporary route for Phase 1 testing only.
// Validates role-based authorization middleware.
router.get(
  '/admin-only',
  protect,
  authorize(ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN),
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);

module.exports = router;

router.post('/', (req, res) => {
  require('fs').writeFileSync('frontend_error.log', JSON.stringify(req.body));
  res.json({ok: true});
});
