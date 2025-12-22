const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all user routes - Only accessible by MANAGERS
router.use(authenticateToken);
router.use(authorizeRoles('MANAGER'));

// GET /api/users - Get all users
router.get('/', userController.getAllUsers.bind(userController));

// POST /api/users - Create new user
router.post('/', userController.createUser.bind(userController));

module.exports = router;
