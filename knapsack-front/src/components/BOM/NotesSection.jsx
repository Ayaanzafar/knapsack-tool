import { useState } from 'react';

export default function NotesSection({ userNotes, onNotesChange, editMode }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');

  const defaultNotes = [
    'Cut Length of Long Rails subject to change during detailing based on availability.',
    'For all Roofs purlins are assumed to be at 1300mm where details of existing purlins are not shown in layout shared by client.',
    'Length of Long Rails subject to change based on actual purlin locations at site to fix the Long rail only on purlin. If any extra length of rails are required, they shall be charged extra.',
    'For Roofs with purlin span more than 1.7m, 2 Long Rails + 1 Mini Rail per each side of panel are considered.',
    'Purlin Details of sheds T10, T11, T14, T15 are not mentioned in report. They are assumed to be 1.5m. If the actual span is more than 1.7m, an extra Mini rail must be considered additionally (at extra cost).',
  ];

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      const newNote = {
        id: Date.now().toString(),
        text: newNoteText.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onNotesChange([...userNotes, newNote]);
      setNewNoteText('');
      setIsAdding(false);
    }
  };

  const handleEditNote = (noteId) => {
    const note = userNotes.find((n) => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditText(note.text);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      const updatedNotes = userNotes.map((note) =>
        note.id === editingNoteId
          ? { ...note, text: editText.trim(), updatedAt: new Date().toISOString() }
          : note
      );
      onNotesChange(updatedNotes);
      setEditingNoteId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = userNotes.filter((note) => note.id !== noteId);
      onNotesChange(updatedNotes);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewNoteText('');
  };

  return (
    <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Note:</h3>

      {/* Default Notes (Read-only) */}
      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-4">
        {defaultNotes.map((note, index) => (
          <li key={`default-${index}`}>{note}</li>
        ))}
      </ol>

      {/* User Notes Section */}
      {(userNotes.length > 0 || editMode) && (
        <div className="mt-4 pt-4 border-t border-yellow-300">
          {userNotes.length > 0 && (
            <ol
              className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-3"
              start={defaultNotes.length + 1}
            >
              {userNotes.map((note) => (
                <li key={note.id} className="flex items-start gap-2 group">
                  {editingNoteId === note.id ? (
                    <div className="flex-1 flex items-start gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1">{note.text}</span>
                      {editMode && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditNote(note.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit note"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete note"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}

          {/* Add Note Section */}
          {editMode && !isAdding && editingNoteId === null && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Note
            </button>
          )}

          {/* Add Note Form */}
          {isAdding && (
            <div className="flex items-start gap-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Enter your note here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                >
                  Add
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
