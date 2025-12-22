const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.use(authenticateToken);
router.get('/me', authController.getMe);
router.post('/change-password', authController.changePassword);

module.exports = router;
