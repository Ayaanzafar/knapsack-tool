const bomService = require('../services/bomService');

class BomController {
  // GET /api/bom/master-items - Get all master items
  async getAllMasterItems(req, res, next) {
    try {
      const items = await bomService.getAllMasterItems();
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bom/master-items/:id - Get single master item
  async getMasterItemById(req, res, next) {
    try {
      const item = await bomService.getMasterItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'BOM master item not found' });
      }
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bom/master-items/sunrack/:code - Get master item by Sunrack code
  async getMasterItemBySunrackCode(req, res, next) {
    try {
      const item = await bomService.getMasterItemBySunrackCode(req.params.code);
      if (!item) {
        return res.status(404).json({ error: 'BOM master item not found' });
      }
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/bom/master-items - Create master item
  async createMasterItem(req, res, next) {
    try {
      const item = await bomService.createMasterItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/bom/master-items/:id - Update master item
  async updateMasterItem(req, res, next) {
    try {
      const item = await bomService.updateMasterItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/bom/master-items/:id - Delete master item
  async deleteMasterItem(req, res, next) {
    try {
      await bomService.deleteMasterItem(req.params.id);
      res.json({ message: 'BOM master item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bom/formulas - Get all formulas
  async getAllFormulas(req, res, next) {
    try {
      const formulas = await bomService.getAllFormulas();
      res.json(formulas);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/bom/formulas - Create formula
  async createFormula(req, res, next) {
    try {
      const formula = await bomService.createFormula(req.body);
      res.status(201).json(formula);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BomController();
