const express = require('express');
const { razorpayWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.post('/razorpay', razorpayWebhook);

module.exports = router;
