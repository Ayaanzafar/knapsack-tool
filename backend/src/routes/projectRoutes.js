const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const tabController = require('../controllers/tabController');
const { authenticateToken, checkPasswordChange } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

// POST /api/projects - Create new project
router.post('/', projectController.createProject.bind(projectController));

// GET /api/projects - Get all projects
router.get('/', projectController.getAllProjects.bind(projectController));

// GET /api/projects/:id - Get project by ID
router.get('/:id', projectController.getProjectById.bind(projectController));

// GET /api/projects/:id/full - Get project with all tabs and rows
router.get('/:id/full', projectController.getProjectWithDetails.bind(projectController));

// PUT /api/projects/:id - Update project
router.put('/:id', projectController.updateProject.bind(projectController));

// DELETE /api/projects/:id - Delete project
router.delete('/:id', projectController.deleteProject.bind(projectController));

// Nested tab routes
// POST /api/projects/:projectId/tabs - Create new tab for project
router.post('/:projectId/tabs', tabController.createTab.bind(tabController));

// GET /api/projects/:projectId/tabs - Get all tabs for project
router.get('/:projectId/tabs', tabController.getTabsByProjectId.bind(tabController));

module.exports = router;
