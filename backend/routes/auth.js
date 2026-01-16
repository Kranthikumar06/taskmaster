const express = require('express');
const router = express.Router();
const { register, login, getMe, refreshToken, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/verify', verifyEmail);
router.get('/me', protect, getMe);

module.exports = router;