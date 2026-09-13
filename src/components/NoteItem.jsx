import React from 'react';
import { AlignLeft, Edit2, Trash2, FileText, Calendar, Link as LinkIcon, Check, GripVertical } from 'lucide-react';
import { priorityColors, priorityLabels } from '../utils/constants';

const NoteItem = ({
  note, onEdit, onDelete, isSelectionMode, isSelected, onToggleSelect,
  dragHandleProps, isDragging
}) => {
  return (
    <div className={`relative bg-[#1e293b]/60 border-t-4 border-t-amber-400 border-x border-b border-glass-border p-5 rounded-xl shadow-lg transition-all duration-300 flex flex-col group backdrop-blur-sm ${
      isSelected ? 'ring-2 ring-accent-primary bg-accent-primary/5' : 'hover:-translate-y-1 hover:shadow-xl'
    } ${isDragging ? 'opacity-40 scale-95 border-dashed border-amber-400' : ''}`}>
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
        <button
          className="text-slate-400 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-md transition-colors"
          onClick={() => { navigator.clipboard.writeText(note.text); }}
          title="نسخ الملاحظة"
        >
          <AlignLeft size={14} />
        </button>
        <button
          className="text-slate-400 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-md transition-colors"
          onClick={() => onEdit(note)}
          title="تعديل"
        >
          <Edit2 size={14} />
        </button>
        <button
          className="text-slate-400 hover:text-red-400 bg-black/20 hover:bg-black/40 p-1.5 rounded-md transition-colors"
          onClick={() => onDelete(note.id)}
          title="حذف"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dragHandleProps && !isSelectionMode && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
              title="سحب لإعادة الترتيب"
            >
              <GripVertical size={16} />
            </div>
          )}

          {isSelectionMode && (
            <button
              type="button"
              onClick={() => onToggleSelect(note.id)}
              className={`w-5 h-5 rounded-md flex justify-center items-center shrink-0 transition-all duration-300 ${
                isSelected
                  ? 'bg-accent-primary border-accent-primary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.4)]'
                  : 'bg-black/30 border border-glass-border hover:border-accent-primary/50 hover:bg-black/40'
              }`}
            >
              {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
            </button>
          )}
          <div className="flex items-center gap-2 text-amber-400/80">
            <FileText size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">ملاحظة</span>
          </div>
        </div>
        {note.priority && note.priority !== 'none' && (
          <span className={`w-2 h-2 rounded-full ${priorityColors[note.priority]}`} title={priorityLabels[note.priority]}></span>
        )}
      </div>
      <p className="text-slate-50 whitespace-pre-wrap leading-relaxed flex-1 text-sm">{note.text}</p>
      {note.link && (
        <a href={note.link} target="_blank" rel="noreferrer" className="mt-3 text-accent-primary text-xs flex items-center gap-1.5 hover:underline w-fit">
          <LinkIcon size={12} /> زيارة الرابط المرفق
        </a>
      )}
      <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
        <span className="flex items-center gap-1.5 opacity-70"><Calendar size={12} /> {note.date}</span>
      </div>
    </div>
  );
};

export default React.memo(NoteItem);
