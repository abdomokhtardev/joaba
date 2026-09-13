import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskItem from '../TaskItem';
import { getLocalDateString } from '../../utils/dateUtils';

const TASK_FILTERS = ['الكل', 'اليوم', 'غداً', 'لاحقاً', 'بدون تاريخ'];

const TaskTabContent = ({
  tasks,
  activeTaskFilter,
  setActiveTaskFilter,
  isSelectionMode,
  selectedIds,
  toggleSelection,
  handleToggleTaskClick,
  setCurrentTask,
  setTaskFormMode,
  handleDeleteItem,
  handleOpenPomodoro,
  onToggleSubtask,
  onReorderTasks
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 border-2 border-dashed border-glass-border rounded-2xl min-h-[200px]">
        <Plus size={32} className="opacity-40" />
        <p className="text-sm">ابدأ بإضافة مهامك</p>
      </div>
    );
  }

  const todayStr = getLocalDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const filteredTasks = tasks.filter(task => {
    if (activeTaskFilter === 'الكل') return true;
    if (activeTaskFilter === 'اليوم') return task.date === todayStr;
    if (activeTaskFilter === 'غداً') return task.date === tomorrowStr;
    if (activeTaskFilter === 'لاحقاً') return task.date > tomorrowStr;
    if (activeTaskFilter === 'بدون تاريخ') return !task.date;
    return true;
  });

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetTaskId) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId || !onReorderTasks) return;
    const currentList = [...tasks];
    const fromIndex = currentList.findIndex(t => t.id === draggedTaskId);
    const toIndex = currentList.findIndex(t => t.id === targetTaskId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [movedItem] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, movedItem);
    onReorderTasks(currentList);
    setDraggedTaskId(null);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 shrink-0">
        {TASK_FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveTaskFilter(filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border ${
              activeTaskFilter === filter
                ? 'bg-accent-primary text-white border-accent-primary shadow-md shadow-accent-primary/20 font-bold'
                : 'bg-white/5 border-glass-border text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-3 pb-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center text-slate-500 py-10 text-sm bg-black/20 rounded-xl border border-glass-border">
            لا توجد مهام في هذا التصنيف.
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              draggable={!isSelectionMode}
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, task.id)}
              onDragEnd={() => setDraggedTaskId(null)}
              className={`transition-all duration-200 ${draggedTaskId === task.id ? 'opacity-50 scale-[0.98]' : ''}`}
            >
              <TaskItem
                task={task}
                onToggle={handleToggleTaskClick}
                onEdit={t => { setCurrentTask(t); setTaskFormMode('edit'); }}
                onDelete={handleDeleteItem}
                onStartPomodoro={handleOpenPomodoro}
                onToggleSubtask={onToggleSubtask}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(task.id)}
                onToggleSelect={toggleSelection}
                isDragging={draggedTaskId === task.id}
                dragHandleProps={{}}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskTabContent;
