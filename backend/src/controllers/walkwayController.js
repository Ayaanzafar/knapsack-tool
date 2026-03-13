const walkwayService = require('../services/walkwayService');

class WalkwayController {
  // GET /api/projects/:projectId/walkway-rows
  async getRows(req, res, next) {
    try {
      const rows = await walkwayService.getRows(req.params.projectId);
      res.json(rows);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/projects/:projectId/walkway-rows/sync
  async syncRows(req, res, next) {
    try {
      const rows = await walkwayService.syncRows(req.params.projectId, req.body.rows);
      res.json(rows);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WalkwayController();
