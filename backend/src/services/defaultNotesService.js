const prisma = require('../prismaClient');

class DefaultNotesService {
  // Get all default notes (ordered by noteOrder)
  async getAllDefaultNotes() {
    return await prisma.defaultNote.findMany({
      orderBy: { noteOrder: 'asc' }
    });
  }

  // Update a specific default note
  async updateDefaultNote(noteOrder, noteText) {
    return await prisma.defaultNote.update({
      where: { noteOrder: parseInt(noteOrder) },
      data: {
        noteText: noteText,
        updatedAt: new Date()
      }
    });
  }

  // Update multiple default notes at once
  async updateDefaultNotes(notes) {
    const updatePromises = notes.map(note =>
      prisma.defaultNote.update({
        where: { noteOrder: parseInt(note.noteOrder) },
        data: {
          noteText: note.noteText,
          updatedAt: new Date()
        }
      })
    );

    return await Promise.all(updatePromises);
  }

  // Add a new default note
  async addDefaultNote(noteText) {
    // Get the highest noteOrder and add 1
    const maxNote = await prisma.defaultNote.findFirst({
      orderBy: { noteOrder: 'desc' }
    });

    const newNoteOrder = maxNote ? maxNote.noteOrder + 1 : 1;

    return await prisma.defaultNote.create({
      data: {
        noteOrder: newNoteOrder,
        noteText: noteText
      }
    });
  }

  // Delete a default note
  async deleteDefaultNote(noteOrder) {
    const deletedNote = await prisma.defaultNote.delete({
      where: { noteOrder: parseInt(noteOrder) }
    });

    // Reorder remaining notes to fill the gap
    await this.reorderAfterDelete(parseInt(noteOrder));

    return deletedNote;
  }

  // Reorder notes after deletion
  async reorderAfterDelete(deletedOrder) {
    // Get all notes with noteOrder > deletedOrder
    const notesToUpdate = await prisma.defaultNote.findMany({
      where: { noteOrder: { gt: deletedOrder } },
      orderBy: { noteOrder: 'asc' }
    });

    // Decrease their noteOrder by 1
    const updatePromises = notesToUpdate.map(note =>
      prisma.defaultNote.update({
        where: { id: note.id },
        data: { noteOrder: note.noteOrder - 1 }
      })
    );

    return await Promise.all(updatePromises);
  }
}

module.exports = new DefaultNotesService();
