const express = require('express');
const { registerBusiness, login } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerBusiness);
router.post('/login', login);

module.exports = router;
