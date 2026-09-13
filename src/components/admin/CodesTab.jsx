import React, { useState } from 'react';
import { Plus, Copy, Trash2, CheckSquare, Square, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../../utils/toastUtils';

const CodesTab = ({
  validCodes = [],
  usedCodes = [],
  usersMap = {},
  onGenerateCodes,
  onDeleteUsedCodes,
  onDeleteSingleCode,
  onBulkDeleteCodes
}) => {
  const [codeQuantity, setCodeQuantity] = useState(1);
  const [codeDuration, setCodeDuration] = useState(30);
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateCodes(codeQuantity, codeDuration);
  };

  const copyAllValidCodes = () => {
    const text = validCodes.map((c) => `${c.code} (${c.durationDays} يوم)`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ جميع الأكواد للحافظة! 📋');
  };

  const toggleSelectCode = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === validCodes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(validCodes.map((c) => c.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    showDeleteConfirm(`حذف ${selectedIds.length} كود نهائياً؟`, () => {
      if (onBulkDeleteCodes) onBulkDeleteCodes(selectedIds);
      setSelectedIds([]);
    }, null);
  };

  const handleDeleteSingle = (id, codeStr) => {
    showDeleteConfirm(`حذف الكود (${codeStr})؟`, () => {
      if (onDeleteSingleCode) onDeleteSingleCode(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }, null);
  };

  const isAllSelected = validCodes.length > 0 && selectedIds.length === validCodes.length;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Generate Codes Form */}
      <div>
        <h2 className="text-xl text-slate-50 font-bold mb-4">توليد أكواد اشتراك جديدة 🔑</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 glass-panel p-5">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-slate-400 mb-1">عدد الأكواد</label>
            <input
              type="number"
              min="1"
              max="1000"
              className="input-glass w-full"
              value={codeQuantity}
              onChange={(e) => setCodeQuantity(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-slate-400 mb-1">المدة (أيام)</label>
            <input
              type="number"
              min="1"
              className="input-glass w-full"
              value={codeDuration}
              onChange={(e) => setCodeDuration(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary py-2.5 px-6 flex items-center gap-2 shadow-lg shadow-accent-primary/20">
            <Plus size={18} /> توليد الأكواد
          </button>
        </form>
      </div>

      {/* 2. Valid Codes Section with Single / Bulk Selection & Deletion */}
      <div className="border-t border-glass-border pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl text-slate-50 font-bold">
              الأكواد الصالحة ({validCodes.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">يمكن للمستخدمين تفعيل هذه الأكواد في أي وقت.</p>
          </div>

          {validCodes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20"
                >
                  <Trash2 size={13} /> حذف المحدد ({selectedIds.length})
                </button>
              )}

              <button
                onClick={toggleSelectAll}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 ${
                  isAllSelected
                    ? 'bg-accent-primary text-white border-accent-primary'
                    : 'bg-white/5 text-slate-300 border-glass-border hover:bg-white/10'
                }`}
              >
                <CheckSquare size={13} />
                <span>{isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
              </button>

              <button
                className="text-xs text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                onClick={copyAllValidCodes}
              >
                <Copy size={13} /> نسخ الجميع
              </button>
            </div>
          )}
        </div>

        {validCodes.length === 0 ? (
          <p className="text-slate-500 text-sm glass-panel p-6 text-center">لا توجد أكواد صالحة حالياً. قم بتوليد دفعة جديدة أعلاه.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {validCodes.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleSelectCode(c.id)}
                  className={`bg-white/5 border p-3 rounded-xl flex items-center justify-between group transition-all cursor-pointer ${
                    isSelected
                      ? 'border-accent-primary bg-accent-primary/10 ring-1 ring-accent-primary'
                      : 'border-glass-border hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Checkbox */}
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${
                        isSelected
                          ? 'bg-accent-primary text-white border-accent-primary'
                          : 'border-slate-500 bg-black/20'
                      }`}
                    >
                      {isSelected && <Check size={11} />}
                    </div>

                    <span className="font-mono text-slate-200 tracking-wider text-sm select-all font-bold">
                      {c.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] bg-accent-primary/20 text-accent-primary font-medium px-2 py-0.5 rounded-md">
                      {c.durationDays} يوم
                    </span>

                    {/* Copy Button */}
                    <button
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(c.code);
                        toast.success('تم نسخ الكود!');
                      }}
                      title="نسخ الكود"
                    >
                      <Copy size={13} />
                    </button>

                    {/* Delete Single Button */}
                    <button
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSingle(c.id, c.code);
                      }}
                      title="حذف هذا الكود"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Used Codes Section */}
      <div className="border-t border-glass-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl text-slate-50 font-bold">الأكواد المستهلكة ({usedCodes.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">سجل الأكواد التي تم استخدامها من قِبل المستخدمين.</p>
          </div>
          {usedCodes.length > 0 && (
            <button
              className="text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              onClick={onDeleteUsedCodes}
            >
              <Trash2 size={13} /> تنظيف الأكواد المستخدمة
            </button>
          )}
        </div>

        {usedCodes.length === 0 ? (
          <p className="text-slate-500 text-sm">لا توجد أكواد مستخدمة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {usedCodes.map((c) => (
              <div key={c.id} className="bg-white/[0.02] border border-glass-border/60 p-3 rounded-lg flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400 line-through">{c.code}</span>
                  <span className="text-slate-500">{c.durationDays} يوم</span>
                </div>
                <p className="text-slate-400 truncate" title={c.usedByEmail || (c.usedBy?.includes('@') ? c.usedBy : (usersMap[c.usedBy] || c.usedBy || 'مستخدم'))}>
                  المستخدم: <span className="text-slate-300 font-medium">{c.usedByEmail || (c.usedBy?.includes('@') ? c.usedBy : (usersMap[c.usedBy] || c.usedBy || 'مستخدم'))}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodesTab;
