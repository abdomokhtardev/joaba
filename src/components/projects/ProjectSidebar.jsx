import React, { useState } from 'react';
import { Plus, CheckSquare, AlignLeft, Edit2, Trash2, X, Check } from 'lucide-react';

const ProjectSidebar = ({ tabs, activeTabId, setActiveTabId, onAddTab, onEditTab, onDeleteTab, onReorderTabs }) => {
  const [showAddTab, setShowAddTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [newTabType, setNewTabType] = useState('tasks');
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [draggedTabId, setDraggedTabId] = useState(null);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTabName.trim()) return;
    onAddTab({ name: newTabName.trim(), type: newTabType });
    setNewTabName('');
    setShowAddTab(false);
  };

  const handleEditSubmit = (e, tabId) => {
    e.preventDefault();
    if (!editingTabName.trim()) return;
    onEditTab(tabId, editingTabName.trim());
    setEditingTabId(null);
  };

  const handleDragStart = (e, tabId) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetTabId) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetTabId || !onReorderTabs) return;
    const currentList = [...tabs];
    const fromIndex = currentList.findIndex(t => t.id === draggedTabId);
    const toIndex = currentList.findIndex(t => t.id === targetTabId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [movedItem] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, movedItem);
    onReorderTabs(currentList);
    setDraggedTabId(null);
  };

  return (
    <aside className="w-full md:w-60 glass-panel p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">التبويبات</h3>
        <button
          className="w-7 h-7 rounded-lg bg-white/5 border border-glass-border flex justify-center items-center text-slate-50 hover:bg-accent-primary hover:border-accent-primary transition-all"
          onClick={() => setShowAddTab(!showAddTab)}
          title="إضافة تبويب"
        >
          <Plus size={15} />
        </button>
      </div>

      {showAddTab && (
        <form className="bg-black/20 p-3 rounded-xl flex flex-col gap-2 border border-glass-border animate-slideDown" onSubmit={handleAddSubmit}>
          <input
            type="text"
            className="input-glass text-sm py-2"
            placeholder="اسم التبويب..."
            value={newTabName}
            onChange={e => setNewTabName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex gap-2 p-1 bg-black/30 rounded-lg border border-glass-border">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all ${newTabType === 'tasks' ? 'bg-accent-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setNewTabType('tasks')}
            >
              <CheckSquare size={14} /> مهام
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all ${newTabType === 'notes' ? 'bg-accent-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setNewTabType('notes')}
            >
              <AlignLeft size={14} /> ملاحظات
            </button>
          </div>
          <div className="flex gap-2 mt-1">
            <button type="button" className="btn-secondary flex-1 py-1.5 text-sm" onClick={() => setShowAddTab(false)}>إلغاء</button>
            <button type="submit" className="btn-primary flex-1 py-1.5 text-sm shadow-md shadow-accent-primary/20">إضافة</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-1 overflow-y-auto flex-1">
        {tabs.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            اضغط + لإضافة تبويب
          </p>
        )}
        {tabs.map(tab => (
          <div
            key={tab.id}
            draggable={editingTabId !== tab.id}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={() => setDraggedTabId(null)}
            className={`group flex flex-col rounded-xl border transition-all ${
              activeTabId === tab.id
                ? 'bg-accent-primary/10 border-accent-primary/30'
                : 'border-transparent hover:bg-white/5 hover:border-glass-border'
            } ${draggedTabId === tab.id ? 'opacity-40 scale-95 border-dashed border-accent-primary' : ''}`}
          >
            {editingTabId === tab.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, tab.id)} className="flex items-center gap-2 p-2">
                <input
                  type="text"
                  className="input-glass text-sm py-1.5 px-2 flex-1 min-w-0"
                  value={editingTabName}
                  onChange={(e) => setEditingTabName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="text-emerald-400 hover:bg-emerald-500/20 p-1.5 rounded-md"><Check size={14} /></button>
                <button type="button" onClick={() => setEditingTabId(null)} className="text-slate-400 hover:bg-white/10 p-1.5 rounded-md"><X size={14} /></button>
              </form>
            ) : (
              <div className="flex items-center">
                <button
                  className={`flex-1 text-right px-3 py-2.5 flex items-center gap-3 text-sm truncate ${activeTabId === tab.id ? 'text-accent-primary font-medium' : 'text-slate-400 group-hover:text-slate-50'}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {tab.type === 'tasks' ? <CheckSquare size={15} /> : <AlignLeft size={15} />}
                  <span className="truncate">{tab.name}</span>
                </button>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity px-2 shrink-0">
                  <button 
                    onClick={() => { setEditingTabId(tab.id); setEditingTabName(tab.name); }}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    title="تعديل"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button 
                    onClick={() => onDeleteTab(tab.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ProjectSidebar;
