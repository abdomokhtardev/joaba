import React, { useState } from 'react';
import { X, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';

const CategoryManagerModal = ({ isOpen, onClose, categories, onEditCategory, onDeleteCategory }) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  // Filter out built-in reserved categories — 'الكل' is a UI-only filter, 'عام' is the fallback bucket
  const customCategories = categories.filter(c => c !== 'الكل' && c !== 'عام');

  const handleEditSubmit = (e, oldName) => {
    e.preventDefault();
    if (!editingName.trim() || editingName.trim() === oldName) {
      setEditingCategory(null);
      return;
    }
    onEditCategory(oldName, editingName.trim());
    setEditingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-glass-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-glass-border">
          <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
            إدارة التصنيفات 🏷️
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {customCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center gap-2">
              <AlertCircle size={32} className="opacity-40" />
              <p>لا توجد تصنيفات مخصصة بعد.</p>
              <p className="text-xs">قم بإضافة روابط بتصنيفات جديدة لتظهر هنا.</p>
            </div>
          ) : (
            customCategories.map(cat => (
              <div key={cat} className="flex flex-col gap-2 p-3 bg-white/5 border border-glass-border rounded-xl">
                {editingCategory === cat ? (
                  <form onSubmit={(e) => handleEditSubmit(e, cat)} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input-glass text-sm py-1.5 px-3 flex-1 min-w-0"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="text-emerald-400 hover:bg-emerald-500/20 p-2 rounded-lg transition-colors">
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={() => setEditingCategory(null)} className="text-slate-400 hover:bg-white/10 p-2 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-200 font-medium">{cat}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setEditingCategory(cat); setEditingName(cat); }}
                        className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                        title="تعديل اسم التصنيف"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteCategory(cat)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                        title="حذف التصنيف ونقل روابطه للعام"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
