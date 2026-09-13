import React, { useState } from 'react';
import { Plus, Edit2, Calendar, Clock, FileText, Link as LinkIcon, Sparkles, X, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDuration } from '../utils/dateUtils';

const DURATION_PRESETS = [
  { label: '15 د', hours: 0.25 },
  { label: '30 د', hours: 0.5 },
  { label: '45 د', hours: 0.75 },
  { label: '1 س', hours: 1 },
  { label: '2 س', hours: 2 },
  { label: '3 س', hours: 3 }
];

const TaskForm = ({
  taskFormMode,
  currentTask,
  setCurrentTask,
  handleSaveTask,
  resetTaskForm
}) => {
  const [subtaskText, setSubtaskText] = useState('');
  const [isSubtasksOpen, setIsSubtasksOpen] = useState((currentTask.subtasks || []).length > 0);

  const handleAddSubtask = () => {
    const trimmed = subtaskText.trim();
    if (!trimmed) return;
    const newSubtask = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      completed: false
    };
    setCurrentTask(p => ({
      ...p,
      subtasks: [...(p.subtasks || []), newSubtask]
    }));
    setSubtaskText('');
    setIsSubtasksOpen(true);
  };

  const handleRemoveSubtask = (indexToRemove) => {
    setCurrentTask(p => ({
      ...p,
      subtasks: (p.subtasks || []).filter((_, i) => i !== indexToRemove)
    }));
  };

  return (
    <form className="bg-black/30 p-5 rounded-2xl flex flex-col gap-5 animate-slideDown border border-accent-primary/20 shrink-0 shadow-lg" onSubmit={handleSaveTask}>
      <h3 className="text-slate-50 font-medium text-lg flex items-center gap-2">
        {taskFormMode === 'add' ? <><Plus size={18} className="text-accent-primary" /> إضافة مهمة جديدة</> : <><Edit2 size={18} className="text-accent-primary" /> تعديل المهمة</>}
      </h3>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-slate-400 font-medium">نص المهمة <span className="text-red-400">*</span></label>
        <input
          type="text"
          className="input-glass text-base py-2.5 px-4"
          placeholder="ما الذي يجب إنجازه؟"
          value={currentTask.text}
          onChange={e => setCurrentTask(p => ({ ...p, text: e.target.value }))}
          required
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><Calendar size={12} /> التاريخ</label>
          <input type="date" className="input-glass bg-slate-900 text-slate-100 w-full text-sm py-2 px-3" value={currentTask.date} onChange={e => setCurrentTask(p => ({ ...p, date: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><Clock size={12} /> الوقت</label>
          <input type="time" className="input-glass bg-slate-900 text-slate-100 w-full text-sm py-2 px-3" value={currentTask.time} onChange={e => setCurrentTask(p => ({ ...p, time: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>المدة المتوقعة</span>
            {currentTask.estimatedHours > 0 && (
              <span className="text-accent-primary font-bold">
                {formatDuration(currentTask.estimatedHours)}
              </span>
            )}
          </div>
          <input
            type="number"
            min="0"
            step="0.05"
            className="input-glass text-sm py-2 px-3"
            placeholder="مثال: 0.5 (نصف ساعة)"
            value={currentTask.estimatedHours}
            onChange={e => setCurrentTask(p => ({ ...p, estimatedHours: e.target.value }))}
          />
          <div className="flex gap-1 flex-wrap mt-0.5">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setCurrentTask(p => ({ ...p, estimatedHours: preset.hours }))}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  Number(currentTask.estimatedHours) === preset.hours
                    ? 'bg-accent-primary text-white border-accent-primary'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">الأهمية (مصفوفة أيزنهاور)</label>
          <select className="input-glass bg-slate-900 text-slate-100 text-sm py-2 px-3 w-full" value={currentTask.priority || 'none'} onChange={e => setCurrentTask(p => ({ ...p, priority: e.target.value }))}>
            <option value="urgent-important" className="bg-slate-800 text-slate-100">مهم وعاجل</option>
            <option value="important" className="bg-slate-800 text-slate-100">مهم وغير عاجل</option>
            <option value="urgent" className="bg-slate-800 text-slate-100">عاجل وغير مهم</option>
            <option value="none" className="bg-slate-800 text-slate-100">غير مهم وغير عاجل</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-[2] flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><FileText size={13} /> ملاحظات إضافية (اختياري)</label>
          <textarea className="input-glass w-full min-h-[80px] resize-y text-sm py-3 px-4 leading-relaxed" placeholder="اكتب أي تفاصيل إضافية هنا..." value={currentTask.taskNote || ''} onChange={e => setCurrentTask(p => ({ ...p, taskNote: e.target.value }))} />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><LinkIcon size={13} /> رابط مرفق (اختياري)</label>
          <input type="url" className="input-glass text-sm py-3 px-4 w-full" placeholder="https://..." value={currentTask.taskLink || ''} onChange={e => setCurrentTask(p => ({ ...p, taskLink: e.target.value }))} />
        </div>
      </div>

      {/* Subtasks (Checklist) Section */}
      <div className="flex flex-col gap-2.5 bg-black/20 p-4 rounded-xl border border-glass-border">
        <button
          type="button"
          onClick={() => setIsSubtasksOpen(prev => !prev)}
          className="flex items-center justify-between w-full text-right group"
        >
          <div className="flex items-center gap-2">
            <ListChecks size={15} className="text-accent-primary" />
            <span className="text-xs text-slate-300 font-medium">الخطوات الفرعية (Checklist) - اختياري</span>
            {(currentTask.subtasks || []).length > 0 && (
              <span className="text-[11px] text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full border border-accent-primary/20">
                {(currentTask.subtasks || []).length} خطوات
              </span>
            )}
          </div>
          <div className="text-slate-400 group-hover:text-white p-1 rounded transition-colors flex items-center gap-1 text-xs">
            <span className="text-[11px] opacity-70">{isSubtasksOpen ? 'طي' : 'عرض'}</span>
            {isSubtasksOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        
        {isSubtasksOpen && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-white/5 animate-slideDown">
            {/* List of subtasks */}
            {(currentTask.subtasks || []).length > 0 && (
              <div className="flex flex-col gap-1.5 mb-1 max-h-48 overflow-y-auto scrollbar-hide">
                {(currentTask.subtasks || []).map((st, idx) => {
                  const text = typeof st === 'string' ? st : (st.text || st.title || '');
                  return (
                    <div key={st.id || idx} className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-glass-border">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
                      <span className="text-sm text-slate-200 flex-1">{text}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="حذف الخطوة"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Input to add subtask */}
            <div className="flex gap-2">
              <input
                type="text"
                className="input-glass text-xs py-2 px-3 flex-1"
                placeholder="اكتب عنوان الخطوة واضغط Enter أو إضافة (مثال: تجهيز المسودة)..."
                value={subtaskText}
                onChange={(e) => setSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 shrink-0"
                onClick={handleAddSubtask}
              >
                <Plus size={14} /> إضافة خطوة
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-3 justify-end border-t border-glass-border pt-4 mt-1">
        <button type="button" className="btn-secondary py-2 px-6 text-sm" onClick={resetTaskForm}>إلغاء</button>
        <button type="submit" className="btn-primary py-2 px-8 text-sm shadow-md shadow-accent-primary/20">{taskFormMode === 'add' ? 'إضافة المهمة' : 'حفظ التعديلات'}</button>
      </div>
    </form>
  );
};

export default TaskForm;
