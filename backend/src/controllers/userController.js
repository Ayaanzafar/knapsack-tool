const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

class UserController {
  // GET /api/users - Get all users (excluding deleted)
  async getAllUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        where: {
          status: {
            not: 'DELETED'
          }
        },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/users - Create new user
  async createUser(req, res, next) {
    try {
      const { username, password, role } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const user = await prisma.user.create({
        data: {
          username,
          passwordHash,
          role,
          status: 'INACTIVE', // New user starts as INACTIVE
          mustChangePassword: true, // Force password change
          isActive: true // Keep for backward compatibility
        },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          mustChangePassword: true,
          createdAt: true
        }
      });

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id - Soft delete user
  async deleteUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id);

      // Prevent self-deletion
      if (req.user.id === userId) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }

      // Check if user exists and is not already deleted
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.status === 'DELETED') {
        return res.status(400).json({ error: 'User is already deleted' });
      }

      // Auto-rename username to free it up for reuse
      // Format: username_deleted_timestamp
      const timestamp = Date.now();
      const newUsername = `${user.username}_deleted_${timestamp}`;

      // Soft delete: rename username, set status to DELETED, and record deletion time
      const deletedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          username: newUsername, // Rename to free up original username
          status: 'DELETED',
          deletedAt: new Date(),
          isActive: false // Update legacy field for compatibility
        },
        select: {
          id: true,
          username: true,
          status: true,
          deletedAt: true
        }
      });

      res.json({
        message: 'User deleted successfully',
        user: deletedUser,
        originalUsername: user.username // Return original username for reference
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/users/:id/status - Update user status (ACTIVE, HOLD)
  async updateUserStatus(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;

      // Prevent self-status update (like putting self on HOLD)
      if (req.user.id === userId) {
        return res.status(400).json({ error: 'You cannot change your own account status' });
      }

      // Validate status
      const validStatuses = ['ACTIVE', 'HOLD', 'INACTIVE'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Update user status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status,
          isActive: status === 'ACTIVE' // Update legacy field
        },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          updatedAt: true
        }
      });

      res.json(updatedUser);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      next(error);
    }
  }

  // POST /api/users/:id/reset-password - Reset user password
  async resetPassword(req, res, next) {
    try {
      const userId = parseInt(req.params.id);

      // Prevent self-reset
      if (req.user.id === userId) {
        return res.status(400).json({ error: 'You cannot reset your own password here. Use profile settings instead.' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.status === 'DELETED') {
        return res.status(400).json({ error: 'Cannot reset password for deleted user' });
      }

      // Generate new temporary password (same logic as user creation)
      const generateTempPassword = () => {
        const length = 12;
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*';
        const allChars = lowercase + uppercase + numbers + symbols;

        let password = '';
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        for (let i = password.length; i < length; i++) {
          password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        return password.split('').sort(() => Math.random() - 0.5).join('');
      };

      const newPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update user: new password, force change, set to INACTIVE
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: true,
          status: 'INACTIVE', // Reset to INACTIVE for security
          isActive: true
        },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          mustChangePassword: true
        }
      });

      res.json({
        message: 'Password reset successfully',
        user: updatedUser,
        temporaryPassword: newPassword // Send back to show in modal
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
