const savedBomService = require('../services/savedBomService');

class SavedBomController {
  // POST /api/saved-boms/project/:projectId - Save BOM snapshot
  async saveBomSnapshot(req, res) {
    try {
      const { projectId } = req.params;
      const { bomData, userNotes, changeLog, customDefaultNotes } = req.body;
      const userId = req.user.id;

      // console.log('saveBomSnapshot - Received userNotes:', userNotes);
      // console.log('saveBomSnapshot - userNotes type:', typeof userNotes);
      // console.log('saveBomSnapshot - userNotes length:', Array.isArray(userNotes) ? userNotes.length : 'N/A');
      // console.log('saveBomSnapshot - customDefaultNotes:', customDefaultNotes);

      if (!bomData) {
        return res.status(400).json({ error: 'bomData is required' });
      }

      const savedBom = await savedBomService.saveBomSnapshot(projectId, {
        bomData,
        userNotes,
        changeLog,
        customDefaultNotes,
        userId
      });

      res.json({
        message: 'BOM snapshot saved successfully',
        savedBom
      });
    } catch (error) {
      console.error('Error saving BOM snapshot:', error);
      res.status(500).json({ error: 'Failed to save BOM snapshot' });
    }
  }

  // GET /api/saved-boms/project/:projectId - Get saved BOM
  async getSavedBom(req, res) {
    try {
      const { projectId } = req.params;

      const savedBom = await savedBomService.getSavedBomByProjectId(projectId);

      if (!savedBom) {
        return res.status(404).json({ error: 'No saved BOM found for this project' });
      }

      // console.log('getSavedBom - Returning savedBom with userNotes:', savedBom.userNotes);
      // console.log('getSavedBom - userNotes type:', typeof savedBom.userNotes);
      // console.log('getSavedBom - userNotes is null?:', savedBom.userNotes === null);

      res.json(savedBom);
    } catch (error) {
      console.error('Error fetching saved BOM:', error);
      res.status(500).json({ error: 'Failed to fetch saved BOM' });
    }
  }

  // GET /api/saved-boms/project/:projectId/exists - Check if saved BOM exists
  async checkSavedBomExists(req, res) {
    try {
      const { projectId } = req.params;

      const exists = await savedBomService.savedBomExists(projectId);

      res.json({ exists });
    } catch (error) {
      console.error('Error checking saved BOM:', error);
      res.status(500).json({ error: 'Failed to check saved BOM' });
    }
  }

  // DELETE /api/saved-boms/project/:projectId - Delete saved BOM
  async deleteSavedBom(req, res) {
    try {
      const { projectId } = req.params;

      const deleted = await savedBomService.deleteSavedBom(projectId);

      if (!deleted) {
        return res.status(404).json({ error: 'No saved BOM found for this project' });
      }

      res.json({ message: 'Saved BOM deleted successfully' });
    } catch (error) {
      console.error('Error deleting saved BOM:', error);
      res.status(500).json({ error: 'Failed to delete saved BOM' });
    }
  }

  // GET /api/saved-boms/all - Get all saved BOMs (for admin)
  async getAllSavedBoms(req, res) {
    try {
      const savedBoms = await savedBomService.getAllSavedBoms();
      res.json(savedBoms);
    } catch (error) {
      console.error('Error fetching all saved BOMs:', error);
      res.status(500).json({ error: 'Failed to fetch saved BOMs' });
    }
  }
}

module.exports = new SavedBomController();
