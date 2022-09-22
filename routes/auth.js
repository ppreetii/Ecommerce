
const express = require('express');

const authController = require('../controllers/mongoose/auth');

const router = express.Router();

// Load Login Page
router.get('/login', authController.getLogin);

//post request for login 
router.post('/login', authController.postLogin);

//post request for logout 
router.post('/logout', authController.postLogout);


module.exports = router;