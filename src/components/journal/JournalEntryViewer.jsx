import React from 'react';
import { BookOpen, Plus, Heart, Calendar } from 'lucide-react';
import { MOODS } from './JournalForm';

const JournalEntryViewer = ({
  loading,
  selectedEntry,
  formMode,
  dateInfo,
  handleAdd
}) => {
  if (loading) {
    return (
      <div className="glass-panel p-10 text-center">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">جاري تحميل اليوميات...</p>
      </div>
    );
  }

  if (selectedEntry && formMode === 'none') {
    const moodObj = MOODS.find((m) => m.key === selectedEntry.mood);

    return (
      <div className="glass-panel p-6 md:p-8 animate-slideDown shadow-xl">
        {/* Mood Badge */}
        {moodObj && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-5 ${moodObj.bg} ${moodObj.color}`}>
            <moodObj.icon size={20} />
            <span className="text-sm font-medium">{moodObj.label}</span>
          </div>
        )}

        {/* Journal Text */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-6 mb-5">
          <p className="text-slate-50 whitespace-pre-wrap leading-[1.9] text-base">{selectedEntry.text}</p>
        </div>

        {/* Gratitude */}
        {selectedEntry.gratitude && (
          <div className="bg-pink-500/5 border border-pink-500/15 rounded-xl p-4 flex items-start gap-3">
            <Heart size={18} className="text-pink-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-pink-400 font-medium mb-1">ممتن لـ</p>
              <p className="text-slate-200 text-sm">{selectedEntry.gratitude}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
          <Calendar size={12} />
          <span>تم التسجيل: {dateInfo.full}</span>
        </div>
      </div>
    );
  }

  if (formMode === 'none') {
    return (
      <div className="glass-panel p-10 text-center border-dashed border-2 border-glass-border">
        <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen size={28} className="text-accent-primary opacity-60" />
        </div>
        <p className="text-slate-400 mb-1">لا توجد يومية لهذا اليوم</p>
        <p className="text-slate-500 text-sm mb-5">اضغط "كتابة يومية" لتسجيل أحداث يومك</p>
        <button className="btn-primary inline-flex items-center gap-2" onClick={handleAdd}>
          <Plus size={16} /> كتابة يومية
        </button>
      </div>
    );
  }

  return null;
};

export default JournalEntryViewer;
