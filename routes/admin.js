const express = require('express');

//const adminController = require('../controllers/mysql/admin');
// const adminController = require('../controllers/mongodb/admin');
const adminController = require('../controllers/mongoose/admin');
const isAuthorised = require('../middleware/authentication');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuthorised, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuthorised, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuthorised, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuthorised, adminController.getEditProduct);

router.post('/edit-product', isAuthorised, adminController.postEditProduct);

router.post('/delete-product', isAuthorised, adminController.postDeleteProduct);

module.exports = router;
