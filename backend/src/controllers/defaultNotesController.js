const defaultNotesService = require('../services/defaultNotesService');

class DefaultNotesController {
  // GET /api/default-notes - Get all default notes
  async getAllDefaultNotes(req, res, next) {
    try {
      const notes = await defaultNotesService.getAllDefaultNotes();
      res.json(notes);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/default-notes/:noteOrder - Update a specific default note
  async updateDefaultNote(req, res, next) {
    try {
      const { noteOrder } = req.params;
      const { noteText } = req.body;

      if (!noteText || !noteText.trim()) {
        return res.status(400).json({ error: 'Note text is required' });
      }

      const updatedNote = await defaultNotesService.updateDefaultNote(noteOrder, noteText.trim());
      res.json(updatedNote);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/default-notes - Update multiple default notes at once
  async updateDefaultNotes(req, res, next) {
    try {
      const { notes } = req.body;

      if (!notes || !Array.isArray(notes)) {
        return res.status(400).json({ error: 'Notes array is required' });
      }

      const updatedNotes = await defaultNotesService.updateDefaultNotes(notes);
      res.json(updatedNotes);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/default-notes - Add a new default note
  async addDefaultNote(req, res, next) {
    try {
      const { noteText } = req.body;

      if (!noteText || !noteText.trim()) {
        return res.status(400).json({ error: 'Note text is required' });
      }

      const newNote = await defaultNotesService.addDefaultNote(noteText.trim());
      res.status(201).json(newNote);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/default-notes/:noteOrder - Delete a default note
  async deleteDefaultNote(req, res, next) {
    try {
      const { noteOrder } = req.params;

      const deletedNote = await defaultNotesService.deleteDefaultNote(noteOrder);
      res.json({ message: 'Default note deleted successfully', deletedNote });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DefaultNotesController();
