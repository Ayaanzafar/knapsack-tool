const customBomService = require('../services/customBomService');

class CustomBomController {
  // GET /api/custom-bom/:projectId
  async get(req, res, next) {
    try {
      const data = await customBomService.getByProjectId(req.params.projectId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/custom-bom/:projectId
  async upsert(req, res, next) {
    try {
      const data = await customBomService.upsert(req.params.projectId, req.body);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomBomController();
