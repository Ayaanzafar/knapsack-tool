const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

class UserController {
  // GET /api/users - Get all users
  async getAllUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
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
          mustChangePassword: true, // Force password change
          isActive: true
        },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
