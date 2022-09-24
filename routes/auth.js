
const express = require('express');

const authController = require('../controllers/mongoose/auth');

const router = express.Router();

// Load Login Page
router.get('/login', authController.getLogin);

//post request for login 
router.post('/login', authController.postLogin);

// Load Signup Page
router.get('/signup', authController.getSignup);

//post request for signup
router.post('/signup', authController.postSignup);

//post request for logout 
router.post('/logout', authController.postLogout);


module.exports = router;