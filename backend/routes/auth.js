const express = require('express');
const router = express.Router();
const { register, login, getMe, refreshToken, verifyEmail, forgotPassword, resetPassword, updateUsername, checkUsername } = require('../controllers/authController');
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/verify', verifyEmail);
router.get('/me', protect, getMe);
router.put('/update-username', protect, updateUsername);
router.get('/check-username', checkUsername);

module.exports = router;