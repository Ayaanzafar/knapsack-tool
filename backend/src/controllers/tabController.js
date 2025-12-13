const tabService = require('../services/tabService');

class TabController {
  // POST /api/projects/:projectId/tabs - Create new tab
  async createTab(req, res, next) {
    try {
      const tab = await tabService.createTab(req.params.projectId, req.body);
      res.status(201).json(tab);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/projects/:projectId/tabs - Get all tabs for project
  async getTabsByProjectId(req, res, next) {
    try {
      const tabs = await tabService.getTabsByProjectId(req.params.projectId);
      res.json(tabs);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/tabs/:id - Get single tab
  async getTabById(req, res, next) {
    try {
      const tab = await tabService.getTabById(req.params.id);
      if (!tab) {
        return res.status(404).json({ error: 'Tab not found' });
      }
      res.json(tab);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/tabs/:id - Update tab
  async updateTab(req, res, next) {
    try {
      const tab = await tabService.updateTab(req.params.id, req.body);
      res.json(tab);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/tabs/:id/profile - Update tab's long rail profile
  async updateTabProfile(req, res, next) {
    try {
      const { profileSerialNumber } = req.body;
      const tab = await tabService.updateTabProfile(req.params.id, profileSerialNumber);
      res.json(tab);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/tabs/:id - Delete tab
  async deleteTab(req, res, next) {
    try {
      await tabService.deleteTab(req.params.id);
      res.json({ message: 'Tab deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/tabs/:id/duplicate - Duplicate tab
  async duplicateTab(req, res, next) {
    try {
      const tab = await tabService.duplicateTab(req.params.id);
      res.status(201).json(tab);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TabController();
