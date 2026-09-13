import React from 'react';
import { Plus, Edit2, BookOpen, Heart, Smile, Meh, Frown, Coffee, Star } from 'lucide-react';

export const MOODS = [
  { key: 'happy', label: 'سعيد', icon: Smile, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  { key: 'neutral', label: 'عادي', icon: Meh, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  { key: 'sad', label: 'حزين', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  { key: 'energetic', label: 'نشيط', icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  { key: 'grateful', label: 'ممتن', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/30' },
  { key: 'inspired', label: 'ملهم', icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
];

const JournalForm = ({
  formMode,
  currentEntry,
  setCurrentEntry,
  handleSave,
  setFormMode,
  dateInfo
}) => {
  return (
    <form className="glass-panel p-6 flex flex-col gap-5 animate-slideDown border-accent-primary/20" onSubmit={handleSave}>
      <h3 className="text-slate-50 font-medium text-lg flex items-center gap-2">
        {formMode === 'add' ? (
          <><Plus size={18} className="text-accent-primary" /> يومية جديدة — {dateInfo.full}</>
        ) : (
          <><Edit2 size={18} className="text-accent-primary" /> تعديل يومية — {dateInfo.full}</>
        )}
      </h3>

      {/* Mood Selector */}
      <div>
        <label className="text-sm text-slate-400 font-medium mb-3 block">كيف كان مزاجك اليوم؟</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(mood => {
            const Icon = mood.icon;
            return (
              <button
                key={mood.key}
                type="button"
                onClick={() => setCurrentEntry(p => ({ ...p, mood: p.mood === mood.key ? '' : mood.key }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm ${currentEntry.mood === mood.key
                  ? `${mood.bg} ${mood.color} shadow-md scale-105`
                  : 'bg-white/5 border-glass-border text-slate-400 hover:bg-white/10'
                  }`}
              >
                <Icon size={18} />
                {mood.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Text */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-slate-400 font-medium flex items-center gap-1">
          <BookOpen size={14} /> ماذا حدث اليوم؟ <span className="text-red-400">*</span>
        </label>
        <textarea
          className="input-glass min-h-[160px] resize-y text-base py-4 px-5 leading-relaxed"
          placeholder="اكتب أفكارك، أحداث يومك، ما تعلمته، أو أي شيء تريد تذكره..."
          value={currentEntry.text}
          onChange={e => setCurrentEntry(p => ({ ...p, text: e.target.value }))}
          maxLength={20000}
          required
          autoFocus
        />
      </div>

      {/* Gratitude */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-slate-400 font-medium flex items-center gap-1">
          <Heart size={14} className="text-pink-400" /> شيء أنت ممتن له اليوم (اختياري)
        </label>
        <input
          type="text"
          className="input-glass text-sm py-3 px-4"
          placeholder="مثال: ممتن لعائلتي، لصحتي، لفرصة عمل جديدة..."
          value={currentEntry.gratitude}
          onChange={e => setCurrentEntry(p => ({ ...p, gratitude: e.target.value }))}
        />
      </div>

      <div className="flex gap-3 justify-end border-t border-glass-border pt-4">
        <button
          type="button"
          className="btn-secondary px-6 text-sm"
          onClick={() => {
            setCurrentEntry({ id: null, text: '', mood: '', gratitude: '' });
            setFormMode('none');
          }}
        >
          إلغاء
        </button>
        <button type="submit" className="btn-primary px-8 text-sm shadow-md shadow-accent-primary/20">
          حفظ اليومية
        </button>
      </div>
    </form>
  );
};

export default JournalForm;
