import React, { useState } from 'react';
import { ArrowRight, CheckSquare, Trash2, Edit2, Check, X } from 'lucide-react';

const ProjectHeader = ({
  project,
  onNavigateBack,
  isSelectionMode,
  setIsSelectionMode,
  selectedIds,
  handleBulkDelete
}) => {

  return (
    <header className="glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          className="flex items-center gap-2 text-slate-400 hover:text-slate-50 hover:bg-white/10 px-3 py-2 rounded-xl transition-all shrink-0"
          onClick={onNavigateBack}
        >
          <ArrowRight size={20} /> العودة
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-xl md:text-2xl text-slate-50 font-medium truncate" title={project?.title}>
            {project?.title || 'مساحة العمل'}
          </h1>
        </div>
      </div>

      {/* Bulk Selection Controls */}
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        {isSelectionMode && selectedIds.length > 0 && (
          <button
            className="btn-secondary text-red-400 border-red-500/20 hover:bg-red-500/10 flex items-center gap-2 text-sm"
            onClick={handleBulkDelete}
          >
            <Trash2 size={16} /> حذف ({selectedIds.length})
          </button>
        )}

        <button
          className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
            isSelectionMode
              ? 'bg-accent-primary text-white border-accent-primary shadow-md'
              : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10 hover:text-white'
          }`}
          onClick={() => setIsSelectionMode(!isSelectionMode)}
        >
          <CheckSquare size={16} />
          <span>{isSelectionMode ? 'إلغاء التحديد' : 'تحديد متعدد'}</span>
        </button>
      </div>
    </header>
  );
};

export default ProjectHeader;
