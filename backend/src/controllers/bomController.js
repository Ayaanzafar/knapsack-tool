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

  // POST /api/bom/save - Save a new BOM
  async saveBom(req, res, next) {
    try {
      const { projectId, bomData } = req.body;
      if (!projectId || !bomData) {
        return res.status(400).json({ error: 'projectId and bomData are required' });
      }
      const savedBom = await bomService.saveBom(projectId, bomData);
      res.status(201).json({ bomId: savedBom.id, message: 'BOM saved successfully' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bom/project/:projectId - Get all BOMs for a project
  async getBomsByProjectId(req, res, next) {
    try {
      const { projectId } = req.params;
      const boms = await bomService.getBomsByProjectId(projectId);
      res.json({ boms });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bom/:bomId - Get a specific BOM by ID
  async getBomById(req, res, next) {
    try {
      const { bomId } = req.params;
      const bom = await bomService.getBomById(bomId);
      if (!bom) {
        return res.status(404).json({ error: 'BOM not found' });
      }
      res.json(bom);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/bom/:bomId - Update a BOM
  async updateBom(req, res, next) {
    try {
      const { bomId } = req.params;
      const { bomData, changeLog } = req.body;
      if (!bomData || !changeLog) {
        return res.status(400).json({ error: 'bomData and changeLog are required' });
      }
      const updatedBom = await bomService.updateBom(bomId, bomData, changeLog);
      res.json(updatedBom);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/bom/update-material - Update material in sunrack_profiles
  async updateMaterial(req, res, next) {
    try {
      const { sunrackCode, oldMaterial, newMaterial, applyToAll } = req.body;

      if (!newMaterial) {
        return res.status(400).json({ error: 'newMaterial is required' });
      }

      if (!applyToAll && !sunrackCode) {
        return res.status(400).json({ error: 'sunrackCode is required when updating single item' });
      }

      const result = await bomService.updateMaterial({ sunrackCode, oldMaterial, newMaterial, applyToAll });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/bom/update-fastener-material - Update material in fasteners table
  async updateFastenerMaterial(req, res, next) {
    try {
      const { fastenerSerialNumber, newMaterial } = req.body;

      if (!fastenerSerialNumber) {
        return res.status(400).json({ error: 'fastenerSerialNumber is required' });
      }

      if (!newMaterial) {
        return res.status(400).json({ error: 'newMaterial is required' });
      }

      const result = await bomService.updateFastenerMaterial({ fastenerSerialNumber, newMaterial });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BomController();
