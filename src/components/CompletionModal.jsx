import React, { useState, useEffect } from 'react';
import { playTaskCompleteSound } from '../utils/audioUtils';
import { formatDuration } from '../utils/dateUtils';

const SPENT_PRESETS = [
  { label: '15 د', val: 0.25 },
  { label: '30 د', val: 0.5 },
  { label: '45 د', val: 0.75 },
  { label: '1 س', val: 1 },
  { label: '2 س', val: 2 },
];

const CompletionModal = ({ modal, onConfirm, onCancel }) => {
  const [spent, setSpent] = useState('');

  // Reset the input when the modal is shown with a new task
  useEffect(() => {
    if (modal.show) {
      setSpent(modal.spent);
    }
  }, [modal]);

  if (!modal.show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="glass-panel p-6 w-full max-w-sm animate-slideDown border-emerald-500/30 shadow-[0_0_40px_rgba(52,211,153,0.15)]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl text-emerald-400 mb-2 font-medium">إنجاز المهمة! 🎉</h3>
        <p className="text-slate-400 mb-4 text-sm">عمل رائع! قم بتأكيد الوقت الفعلي الذي استغرقته المهمة.</p>

        {modal.estimated > 0 && (
          <div className="mb-4 bg-white/5 border border-white/10 p-3 rounded-lg text-sm text-slate-300">
            المدة المتوقعة كانت: <strong className="text-accent-primary ml-1">{formatDuration(modal.estimated)}</strong>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-50 mb-2 text-sm">
          <span>الوقت الفعلي المستغرق:</span>
          {spent > 0 && (
            <span className="text-emerald-400 font-bold">{formatDuration(spent)}</span>
          )}
        </div>

        <input
          type="number"
          step="0.05"
          min="0"
          className="input-glass w-full mb-2"
          placeholder="مثال: 0.5 (نصف ساعة)"
          value={spent}
          onChange={e => setSpent(e.target.value)}
          autoFocus
        />

        <div className="flex gap-1.5 flex-wrap mb-6">
          {SPENT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setSpent(p.val)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                Number(spent) === p.val
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            className="btn-primary flex-1 !bg-emerald-500 hover:!bg-emerald-600 shadow-lg shadow-emerald-500/20"
            onClick={() => {
              playTaskCompleteSound();
              onConfirm(spent);
            }}
          >
            تأكيد الإنجاز
          </button>
          <button className="btn-secondary flex-1" onClick={onCancel}>إلغاء</button>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
