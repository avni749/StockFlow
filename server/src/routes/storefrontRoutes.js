const express = require('express');
const { getStorefront, getProducts, getProduct, createOrder, cancelOrder, createPayment, verifyPayment } = require('../controllers/storefrontController');

const router = express.Router({ mergeParams: true });

router.get('/', getStorefront);
router.get('/products', getProducts);
router.get('/products/:productId', getProduct);
router.post('/orders', createOrder);
router.post('/orders/:orderId/cancel', cancelOrder);
router.post('/orders/:orderId/payment/create', createPayment);
router.post('/orders/:orderId/payment/verify', verifyPayment);

module.exports = router;
