import React from 'react';
import { Plus, Edit2, Link as LinkIcon, Folder, Tag, X } from 'lucide-react';

const LinkForm = ({
  formMode,
  currentLink,
  setCurrentLink,
  handleSaveLink,
  onClose,
  categories = []
}) => {
  if (formMode === 'none') return null;

  return (
    <form
      className="glass-panel p-6 mb-6 border-accent-primary/30 animate-slideDown flex flex-col gap-4 shadow-xl"
      onSubmit={handleSaveLink}
    >
      <div className="flex items-center justify-between border-b border-glass-border pb-3">
        <h3 className="text-slate-50 font-medium text-lg flex items-center gap-2">
          {formMode === 'add' ? (
            <><Plus size={18} className="text-accent-primary" /> إضافة رابط جديد</>
          ) : (
            <><Edit2 size={18} className="text-accent-primary" /> تعديل الرابط</>
          )}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">عنوان الرابط / الوصف <span className="text-red-400">*</span></label>
          <input
            type="text"
            className="input-glass text-sm py-2.5 px-3"
            placeholder="مثال: وثائق React الرسمية"
            value={currentLink.title}
            onChange={(e) => setCurrentLink((p) => ({ ...p, title: e.target.value }))}
            maxLength={200}
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">الرابط (URL) <span className="text-red-400">*</span></label>
          <input
            type="url"
            className="input-glass text-sm py-2.5 px-3"
            placeholder="https://example.com"
            value={currentLink.url}
            onChange={(e) => setCurrentLink((p) => ({ ...p, url: e.target.value }))}
            maxLength={2000}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">التصنيف (مجلد)</label>
          <input
            type="text"
            list="categories-list"
            className="input-glass text-sm py-2.5 px-3"
            placeholder="مثال: برمجة، تصميم، مقالات..."
            value={currentLink.category}
            onChange={(e) => setCurrentLink((p) => ({ ...p, category: e.target.value }))}
          />
          <datalist id="categories-list">
            {categories.filter((c) => c !== 'الكل').map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">الأهمية (مصفوفة أيزنهاور)</label>
          <select
            className="input-glass bg-slate-900 text-slate-100 text-sm py-2.5 px-3"
            value={currentLink.priority || 'none'}
            onChange={(e) => setCurrentLink((p) => ({ ...p, priority: e.target.value }))}
          >
            <option value="urgent-important" className="bg-slate-800 text-slate-100">مهم وعاجل</option>
            <option value="important" className="bg-slate-800 text-slate-100">مهم وغير عاجل</option>
            <option value="urgent" className="bg-slate-800 text-slate-100">عاجل وغير مهم</option>
            <option value="none" className="bg-slate-800 text-slate-100">غير مهم وغير عاجل</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-glass-border">
        <button type="button" className="btn-secondary text-sm py-2 px-5" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary text-sm py-2 px-7 shadow-md shadow-accent-primary/20">
          {formMode === 'add' ? 'حفظ الرابط' : 'تحديث الرابط'}
        </button>
      </div>
    </form>
  );
};

export default LinkForm;
