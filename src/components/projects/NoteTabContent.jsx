import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import NoteItem from '../NoteItem';

const NoteTabContent = ({
  notes,
  isSelectionMode,
  selectedIds,
  toggleSelection,
  setCurrentNote,
  setNoteFormMode,
  handleDeleteItem,
  onReorderNotes
}) => {
  const [draggedNoteId, setDraggedNoteId] = useState(null);

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 border-2 border-dashed border-glass-border rounded-2xl min-h-[200px]">
        <Plus size={32} className="opacity-40" />
        <p className="text-sm">ابدأ بإضافة ملاحظاتك</p>
      </div>
    );
  }

  const handleDragStart = (e, noteId) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetNoteId) => {
    e.preventDefault();
    if (!draggedNoteId || draggedNoteId === targetNoteId || !onReorderNotes) return;
    const currentList = [...notes];
    const fromIndex = currentList.findIndex(n => n.id === draggedNoteId);
    const toIndex = currentList.findIndex(n => n.id === targetNoteId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [movedItem] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, movedItem);
    onReorderNotes(currentList);
    setDraggedNoteId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {notes.map(note => (
          <div
            key={note.id}
            draggable={!isSelectionMode}
            onDragStart={(e) => handleDragStart(e, note.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, note.id)}
            onDragEnd={() => setDraggedNoteId(null)}
            className="transition-transform duration-200"
          >
            <NoteItem
              note={note}
              onEdit={n => { setCurrentNote(n); setNoteFormMode('edit'); }}
              onDelete={() => handleDeleteItem(note.id)}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(note.id)}
              onToggleSelect={toggleSelection}
              isDragging={draggedNoteId === note.id}
              dragHandleProps={{}}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteTabContent;
