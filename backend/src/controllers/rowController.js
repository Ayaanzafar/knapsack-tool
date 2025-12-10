const rowService = require('../services/rowService');

class RowController {
  // POST /api/tabs/:tabId/rows - Create new row
  async createRow(req, res, next) {
    try {
      const row = await rowService.createRow(req.params.tabId, req.body);
      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/tabs/:tabId/rows - Get all rows for tab
  async getRowsByTabId(req, res, next) {
    try {
      const rows = await rowService.getRowsByTabId(req.params.tabId);
      res.json(rows);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/rows/:id - Get single row
  async getRowById(req, res, next) {
    try {
      const row = await rowService.getRowById(req.params.id);
      if (!row) {
        return res.status(404).json({ error: 'Row not found' });
      }
      res.json(row);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/rows/:id - Update row
  async updateRow(req, res, next) {
    try {
      const row = await rowService.updateRow(req.params.id, req.body);
      res.json(row);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/rows/:id - Delete row
  async deleteRow(req, res, next) {
    try {
      await rowService.deleteRow(req.params.id);
      res.json({ message: 'Row deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/tabs/:tabId/rows/reorder - Reorder rows
  async reorderRows(req, res, next) {
    try {
      const rows = await rowService.reorderRows(req.params.tabId, req.body.rows);
      res.json(rows);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RowController();
