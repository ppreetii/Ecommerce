
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

// Load Reset Password Page
router.get('/reset', authController.getResetPassword);

//post request for reset
router.post('/reset', authController.postResetPassword);

// Load New Password Page
router.get('/reset/:token', authController.getNewPassword);

//post request for new password
router.post('/new-password', authController.postNewPassword);

module.exports = router;