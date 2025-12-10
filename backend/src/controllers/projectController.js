const projectService = require('../services/projectService');

class ProjectController {
  // POST /api/projects - Create new project
  async createProject(req, res, next) {
    try {
      const project = await projectService.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/projects - Get all projects
  async getAllProjects(req, res, next) {
    try {
      const projects = await projectService.getAllProjects();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/projects/:id - Get project by ID
  async getProjectById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/projects/:id/full - Get project with all tabs and rows
  async getProjectWithDetails(req, res, next) {
    try {
      const project = await projectService.getProjectWithDetails(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/projects/:id - Update project
  async updateProject(req, res, next) {
    try {
      const project = await projectService.updateProject(req.params.id, req.body);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/projects/:id - Delete project
  async deleteProject(req, res, next) {
    try {
      await projectService.deleteProject(req.params.id);
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
