const express = require('express');

// const shopController = require('../controllers/mysql/shop');
// const shopController = require('../controllers/mongodb/shop');
const shopController = require('../controllers/mongoose/shop');
const isAuthorised = require('../middleware/authentication');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuthorised , shopController.getCart);

router.post('/cart', isAuthorised , shopController.postCart);

router.post('/cart-delete-item', isAuthorised , shopController.postCartDeleteProduct);

router.get('/orders', isAuthorised , shopController.getOrders);

router.get('/orders/:orderId', isAuthorised , shopController.getInvoice);

// router.post('/create-order', isAuthorised ,shopController.postOrder);

router.get('/checkout', isAuthorised , shopController.getCheckout);

router.get('/checkout/success', isAuthorised , shopController.postOrder);

router.get('/checkout/cancel', isAuthorised , shopController.getCheckout);

module.exports = router;
