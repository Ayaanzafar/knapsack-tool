const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles, requirePermission } = require('../middleware/authMiddleware');

// Public authenticated routes (accessible to all authenticated users)
router.get('/list', authenticateToken, userController.getUserList.bind(userController));

// Protect all other user routes - Only accessible by roles with canManageUsers
router.use(authenticateToken);
router.use(requirePermission('canManageUsers'));

// GET /api/users - Get all users
router.get('/', userController.getAllUsers.bind(userController));

// POST /api/users - Create new user
router.post('/', userController.createUser.bind(userController));

// DELETE /api/users/:id - Soft delete user
router.delete('/:id', userController.deleteUser.bind(userController));

// PATCH /api/users/:id/status - Update user status
router.patch('/:id/status', userController.updateUserStatus.bind(userController));

// POST /api/users/:id/reset-password - Reset user password
router.post('/:id/reset-password', userController.resetPassword.bind(userController));

module.exports = router;
