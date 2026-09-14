import React from 'react';
import { Plus, Edit2, Link as LinkIcon } from 'lucide-react';

const NoteForm = ({
  noteFormMode,
  currentNote,
  setCurrentNote,
  handleSaveNote,
  resetNoteForm
}) => {
  return (
    <form className="bg-slate-900/90 sm:bg-black/30 p-4 sm:p-5 rounded-2xl flex flex-col gap-4 animate-slideDown border border-accent-primary/20 shadow-xl overflow-y-auto max-h-[78vh] md:max-h-none shrink-0" onSubmit={handleSaveNote}>
      <h3 className="text-slate-50 font-medium text-lg flex items-center gap-2">
        {noteFormMode === 'add' ? <><Plus size={18} className="text-accent-primary" /> إضافة ملاحظة جديدة</> : <><Edit2 size={18} className="text-accent-primary" /> تعديل الملاحظة</>}
      </h3>
      <textarea
        className="input-glass min-h-[120px] resize-y text-base py-3 px-4 leading-relaxed"
        placeholder="اكتب فكرة، رابط، أو ملاحظة سريعة..."
        value={currentNote.text}
        onChange={e => setCurrentNote(p => ({ ...p, text: e.target.value }))}
        required
        autoFocus
      />
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><LinkIcon size={13} /> رابط اختياري</label>
          <input type="url" className="input-glass text-sm py-2 px-3 w-full" placeholder="https://..." value={currentNote.link} onChange={e => setCurrentNote(p => ({ ...p, link: e.target.value }))} />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">الأهمية</label>
          <select className="input-glass bg-slate-900 text-slate-100 text-sm py-2 px-3 w-full" value={currentNote.priority || 'none'} onChange={e => setCurrentNote(p => ({ ...p, priority: e.target.value }))}>
            <option value="urgent-important" className="bg-slate-800 text-slate-100">مهم وعاجل</option>
            <option value="important" className="bg-slate-800 text-slate-100">مهم وغير عاجل</option>
            <option value="urgent" className="bg-slate-800 text-slate-100">عاجل وغير مهم</option>
            <option value="none" className="bg-slate-800 text-slate-100">عادي</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 justify-end border-t border-glass-border pt-3 mt-1 sticky bottom-0 bg-slate-900/95 -mx-4 -mb-4 p-3.5 rounded-b-2xl backdrop-blur-md z-10">
        <button type="button" className="btn-secondary py-2 px-5 text-sm" onClick={resetNoteForm}>إلغاء</button>
        <button type="submit" className="btn-primary py-2 px-7 text-sm shadow-md shadow-accent-primary/20">{noteFormMode === 'add' ? 'حفظ الملاحظة' : 'حفظ التعديلات'}</button>
      </div>
    </form>
  );
};

export default NoteForm;
