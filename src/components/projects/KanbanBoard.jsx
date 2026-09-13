import React, { useState } from 'react';
import { Clock, Calendar, Edit2, Trash2, CheckCircle2, Circle, PlayCircle, ListChecks, Link as LinkIcon } from 'lucide-react';
import { priorityColors, priorityLabels } from '../../utils/constants';
import { formatDuration } from '../../utils/dateUtils';

const KanbanBoard = ({
  tasks = [],
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onStartPomodoro,
  onUpdateTasksStatus,
  onToggleSubtask
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Group tasks into 3 columns
  const todoTasks = tasks.filter(t => !t.completed && t.status !== 'in_progress');
  const inProgressTasks = tasks.filter(t => !t.completed && t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.completed);

  const columns = [
    {
      id: 'todo',
      title: 'قيد الانتظار',
      tasks: todoTasks,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      headerBorder: 'border-t-blue-500',
      statusValue: 'todo',
      completedValue: false
    },
    {
      id: 'in_progress',
      title: 'جاري العمل',
      tasks: inProgressTasks,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      headerBorder: 'border-t-amber-500',
      statusValue: 'in_progress',
      completedValue: false
    },
    {
      id: 'done',
      title: 'مكتملة',
      tasks: doneTasks,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      headerBorder: 'border-t-emerald-500',
      statusValue: 'done',
      completedValue: true
    }
  ];

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnColumn = (e, col) => {
    e.preventDefault();
    if (!draggedTaskId || !onUpdateTasksStatus) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) return;

    const updatedTasks = tasks.map(t => {
      if (t.id === draggedTaskId) {
        return {
          ...t,
          status: col.statusValue,
          completed: col.completedValue
        };
      }
      return t;
    });

    onUpdateTasksStatus(updatedTasks);
    setDraggedTaskId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full pb-4 overflow-x-auto">
      {columns.map(col => (
        <div
          key={col.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnColumn(e, col)}
          className={`glass-panel p-4 flex flex-col gap-3 rounded-2xl border-t-4 ${col.headerBorder} min-h-[350px] bg-white/[0.02]`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-glass-border">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">{col.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${col.badgeColor}`}>
                {col.tasks.length}
              </span>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto scrollbar-hide">
            {col.tasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-white/10 rounded-xl text-xs text-slate-500 text-center">
                اسحب المهام وأفلتها هنا
              </div>
            ) : (
              col.tasks.map(task => {
                const subtasks = task.subtasks || [];
                const completedSubtasks = subtasks.filter(st => st.completed).length;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`bg-white/5 hover:bg-white/10 border border-glass-border p-3.5 rounded-xl flex flex-col gap-2.5 cursor-grab active:cursor-grabbing transition-all hover:border-accent-primary/40 ${
                      draggedTaskId === task.id ? 'opacity-40 scale-95 border-dashed border-accent-primary' : ''
                    }`}
                  >
                    {/* Priority & Quick Actions */}
                    <div className="flex items-center justify-between gap-2">
                      {task.priority && task.priority !== 'none' ? (
                        <span className="text-[10px] text-slate-400 bg-black/20 px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/5">
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority]}`} />
                          {priorityLabels[task.priority]}
                        </span>
                      ) : <span />}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1 text-slate-500 hover:text-accent-primary rounded transition-colors"
                          title="تعديل"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Task Title */}
                    <p className={`text-sm text-slate-100 font-medium line-clamp-3 leading-relaxed ${task.completed ? 'line-through text-slate-400' : ''}`}>
                      {task.text}
                    </p>

                    {/* Subtasks Progress if any */}
                    {subtasks.length > 0 && (
                      <div className="flex items-center gap-2 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5 text-[11px] text-slate-300">
                        <ListChecks size={12} className="text-accent-primary" />
                        <span>الخطوات: {completedSubtasks}/{subtasks.length}</span>
                        <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden mr-1">
                          <div
                            className="bg-accent-primary h-full rounded-full"
                            style={{ width: `${Math.round((completedSubtasks / subtasks.length) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Meta info & Action */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        {task.date && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar size={11} /> {task.date}
                          </span>
                        )}
                        {task.estimatedHours > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400/80">
                            <Clock size={11} /> {formatDuration(task.estimatedHours)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!task.completed && onStartPomodoro && (
                          <button
                            onClick={() => onStartPomodoro(task)}
                            className="p-1 text-indigo-400 hover:text-indigo-300 rounded"
                            title="جلسة تركيز"
                          >
                            <PlayCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => onToggleTask(task)}
                          className={`p-1 rounded transition-colors ${task.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}
                          title={task.completed ? 'إلغاء الإنجاز' : 'إنجاز المهمة'}
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
