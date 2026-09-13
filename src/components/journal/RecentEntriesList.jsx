import React from 'react';
import { Calendar, Trash2, CheckSquare, Heart } from 'lucide-react';
import { formatArabicDate } from '../../utils/dateUtils';
import { MOODS } from './JournalForm';

const RecentEntriesList = ({
  entries = [],
  selectedDate,
  onSelectDate,
  isSelectionMode,
  setIsSelectionMode,
  selectedIds,
  setSelectedIds,
  onBulkDelete
}) => {
  if (entries.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
          <Calendar size={14} className="text-accent-primary" /> آخر التسجيلات
        </h3>
        <div className="flex items-center gap-2">
          {isSelectionMode && selectedIds.length > 0 && (
            <button
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              onClick={onBulkDelete}
            >
              <Trash2 size={14} /> حذف ({selectedIds.length})
            </button>
          )}
          <button
            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              isSelectionMode
                ? 'bg-accent-primary text-white'
                : 'bg-white/5 text-slate-400 border border-glass-border hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
          >
            <CheckSquare size={14} /> تحديد
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[...entries]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5)
          .map((entry) => {
            const info = formatArabicDate(entry.date);
            const entryMood = MOODS.find((m) => m.key === entry.mood);
            const isActive = entry.date === selectedDate;
            const isSelected = selectedIds.includes(entry.id);

            return (
              <div
                key={entry.id}
                onClick={() => {
                  if (isSelectionMode) {
                    if (isSelected) setSelectedIds(selectedIds.filter((id) => id !== entry.id));
                    else setSelectedIds([...selectedIds, entry.id]);
                  } else {
                    onSelectDate(entry.date);
                  }
                }}
                className={`glass-panel p-4 text-right flex items-center gap-4 transition-all ${
                  isSelectionMode
                    ? 'cursor-pointer hover:border-accent-primary/50'
                    : 'cursor-pointer hover:-translate-y-0.5 hover:border-white/15'
                } ${isActive && !isSelectionMode ? 'border-accent-primary/40 bg-accent-primary/5' : ''} ${
                  isSelected && isSelectionMode ? 'ring-2 ring-accent-primary border-accent-primary/50' : ''
                }`}
              >
                {isSelectionMode && (
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-accent-primary text-white border-accent-primary'
                        : 'border-slate-600 bg-black/20'
                    }`}
                  >
                    {isSelected && <span className="text-xs font-bold">✓</span>}
                  </div>
                )}

                {entryMood && (
                  <div className={`p-2.5 rounded-xl border shrink-0 ${entryMood.bg} ${entryMood.color}`}>
                    <entryMood.icon size={18} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-100">{info.dayName}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {info.dayNum} {info.month} {info.year}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 opacity-80">{entry.text}</p>
                </div>

                {entry.gratitude && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/15 shrink-0">
                    <Heart size={12} />
                    <span className="line-clamp-1 max-w-[120px]">{entry.gratitude}</span>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default RecentEntriesList;
