import React, { useState } from 'react';
import { CheckSquare, Square, Calendar, Clock, Edit2, FileText, ChevronDown, ChevronUp, Trash2, Link as LinkIcon, Check, GripVertical, ListChecks } from 'lucide-react';
import { priorityColors, priorityLabels } from '../utils/constants';
import { formatDuration } from '../utils/dateUtils';

const TaskItem = ({
  task, onToggle, onEdit, onDelete, onToggleNote, onStartPomodoro,
  isSelectionMode, isSelected, onToggleSelect,
  onToggleSubtask, dragHandleProps, isDragging
}) => {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const estimated = task.estimatedHours || 0;
  const spent = task.spentHours || 0;
  let progressPercent = 0;
  if (estimated > 0) {
    progressPercent = Math.min(100, Math.round((spent / estimated) * 100));
  } else if (task.completed) {
    progressPercent = 100;
  }

  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter(st => st.completed).length;

  return (
    <div className={`group flex flex-col p-5 bg-white/5 border rounded-2xl transition-all duration-300 hover:shadow-lg relative ${
      task.completed ? 'opacity-70 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10' : 'border-glass-border hover:bg-white/10 hover:border-white/20'
    } ${isDragging ? 'opacity-40 scale-95 border-dashed border-accent-primary' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        {dragHandleProps && !isSelectionMode && (
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 mt-1.5 p-0.5 rounded transition-colors shrink-0"
            title="سحب لإعادة الترتيب"
          >
            <GripVertical size={18} />
          </div>
        )}

        {isSelectionMode ? (
          <button
            type="button"
            onClick={() => onToggleSelect(task.id)}
            className={`w-6 h-6 mt-1 rounded-lg flex justify-center items-center shrink-0 transition-all duration-300 ${isSelected
                ? 'bg-accent-primary border-accent-primary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.4)]'
                : 'bg-black/30 border border-glass-border hover:border-accent-primary/50 hover:bg-black/40'
              }`}
          >
            {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
          </button>
        ) : (
          <button
            className="text-slate-400 hover:text-accent-primary mt-1 shrink-0 transition-transform active:scale-90"
            onClick={() => onToggle(task)}
            title={task.completed ? 'إلغاء الإنجاز' : 'إنجاز المهمة'}
          >
            {task.completed
              ? <CheckSquare size={26} className="text-emerald-500" />
              : <Square size={26} />
            }
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <p className={`text-slate-50 text-lg ${task.completed ? 'line-through text-slate-400' : ''}`}>
              {task.text}
            </p>
            {task.priority && task.priority !== 'none' && (
              <span className={`shrink-0 mt-2 w-2 h-2 rounded-full ${priorityColors[task.priority]}`} title={priorityLabels[task.priority]}></span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-3 text-xs text-slate-400">
            {task.date && (
              <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md">
                <Calendar size={12} /> {task.date}
              </span>
            )}
            {task.time && (
              <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md">
                <Clock size={12} /> {task.time}
              </span>
            )}
            {estimated > 0 && (
              <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md border border-amber-500/20">
                <Clock size={12} /> المتوقع: {formatDuration(estimated)}
              </span>
            )}
            {task.taskLink && (
              <a
                href={task.taskLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent-primary bg-accent-primary/10 px-2 py-1 rounded-md transition-colors hover:bg-accent-primary/20 hover:underline"
              >
                <LinkIcon size={12} /> زيارة الرابط
              </a>
            )}
            {!task.completed && onStartPomodoro && (
              <button
                type="button"
                className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-md transition-colors border border-indigo-500/20"
                onClick={() => onStartPomodoro(task)}
                title="بدء جلسة تركيز بومودورو"
              >
                <Clock size={12} /> بدء تركيز ⏳
              </button>
            )}
            {task.taskNote && (
              <button
                className="flex items-center gap-1 text-accent-primary bg-accent-primary/10 px-2 py-1 rounded-md transition-colors hover:bg-accent-primary/20"
                onClick={() => setNoteExpanded(p => !p)}
              >
                <FileText size={12} /> ملاحظات {noteExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            {subtasks.length > 0 && (
              <button
                className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md transition-colors hover:bg-emerald-500/20 border border-emerald-500/20"
                onClick={() => setSubtasksExpanded(p => !p)}
              >
                <ListChecks size={12} /> الخطوات ({completedSubtasksCount}/{subtasks.length}) {subtasksExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          {(estimated > 0 || spent > 0) && (
            <div className="w-full max-w-xs mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>الإنجاز: <strong className="text-slate-200">{formatDuration(spent)}</strong> / {formatDuration(estimated)}</span>
                <span className="text-accent-primary">{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-accent-primary to-purple-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 bg-black/20 p-1 rounded-lg">
          <button
            className="text-slate-400 hover:text-accent-primary hover:bg-white/10 rounded-md transition-colors p-2"
            onClick={() => onEdit(task)}
            title="تعديل"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors p-2"
            onClick={() => onDelete(task.id)}
            title="حذف"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Subtasks Checklist */}
      {subtasks.length > 0 && subtasksExpanded && (
        <div className="mt-3 pt-3 border-t border-glass-border animate-slideDown flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1.5"><ListChecks size={14} className="text-accent-primary" /> خطوات الإنجاز:</span>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {completedSubtasksCount}/{subtasks.length} ({Math.round((completedSubtasksCount / subtasks.length) * 100)}%)
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {subtasks.map((st, idx) => {
              const text = typeof st === 'string' ? st : (st.text || st.title || '');
              const stId = typeof st === 'object' && st.id ? st.id : idx;
              const isCompleted = typeof st === 'object' ? Boolean(st.completed) : false;

              return (
                <div
                  key={stId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleSubtask) onToggleSubtask(task.id, stId);
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 cursor-pointer transition-all ${
                    isCompleted ? 'opacity-60 bg-emerald-500/5 border-emerald-500/10' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleSubtask) onToggleSubtask(task.id, stId);
                    }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-black/30 border border-glass-border hover:border-accent-primary'
                    }`}
                  >
                    {isCompleted && <Check size={12} strokeWidth={3} />}
                  </button>
                  <span className={`text-xs text-slate-200 flex-1 select-none leading-relaxed ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {task.taskNote && noteExpanded && (
        <div className="mt-3 pt-3 border-t border-glass-border animate-slideDown">
          <h4 className="text-sm text-accent-primary mb-2 flex items-center gap-2">
            <FileText size={14} /> ملاحظات المهمة:
          </h4>
          <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
            {task.taskNote}
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(TaskItem);
