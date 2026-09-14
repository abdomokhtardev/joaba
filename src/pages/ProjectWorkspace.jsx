import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Folder, Clock } from 'lucide-react';
import Confetti from 'react-confetti';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateString } from '../utils/dateUtils';
import CompletionModal from '../components/CompletionModal';
import TaskForm from '../components/TaskForm';
import NoteForm from '../components/NoteForm';
import PomodoroModal from '../components/PomodoroModal';
import { playTaskCompleteSound } from '../utils/audioUtils';
import { showDeleteConfirm } from '../utils/toastUtils';
import ProjectSidebar from '../components/projects/ProjectSidebar';
import ProjectHeader from '../components/projects/ProjectHeader';
import TaskTabContent from '../components/projects/TaskTabContent';
import NoteTabContent from '../components/projects/NoteTabContent';
import toast from 'react-hot-toast';

// --- Main Component ---
const ProjectWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [project, setProject] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTabId, setActiveTabId] = useState('');

  const [taskFormMode, setTaskFormMode] = useState('none');
  const [currentTask, setCurrentTask] = useState({ text: '', date: getLocalDateString(), time: '', estimatedHours: '', priority: 'none', taskNote: '', taskLink: '' });
  const [activeTaskFilter, setActiveTaskFilter] = useState('اليوم');

  const [noteFormMode, setNoteFormMode] = useState('none');
  const [currentNote, setCurrentNote] = useState({ id: null, text: '', priority: 'none', link: '' });

  const [completionModal, setCompletionModal] = useState({ show: false, taskId: null, spent: '', estimated: 0 });
  const [pomodoroModal, setPomodoroModal] = useState({ show: false, task: null });
  const [showConfetti, setShowConfetti] = useState(false);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // FIX: removed activeTabId from deps to prevent infinite re-subscription
  useEffect(() => {
    if (!currentUser || !id) return;

    const projectRef = doc(db, 'projects', id);
    const unsubscribe = onSnapshot(
      projectRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject(data);
          const fetchedTabs = data.tabs || [];
          setTabs(fetchedTabs);
          // Only set the initial active tab on first load
          setActiveTabId(prev => {
            if (!prev && fetchedTabs.length > 0) return fetchedTabs[0].id;
            return prev;
          });
        } else {
          navigate('/projects');
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Project workspace listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, currentUser, navigate]); // activeTabId intentionally excluded

  const activeTab = tabs.find(t => t.id === activeTabId);

  const saveTabsToFirebase = useCallback(async (updatedTabs) => {
    try {
      await updateDoc(doc(db, 'projects', id), { 
        tabs: updatedTabs,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving tabs:', error);
    }
  }, [id]);

  const updateTabContent = useCallback((updater) => {
    setTabs(prev => {
      const updated = prev.map(tab => tab.id === activeTabId ? updater(tab) : tab);
      saveTabsToFirebase(updated);
      return updated;
    });
  }, [activeTabId, saveTabsToFirebase]);

  const handleAddTab = ({ name, type }) => {
    const newTab = { id: Date.now().toString(), name, type, content: [] };
    const updated = [...tabs, newTab];
    setTabs(updated);
    setActiveTabId(newTab.id);
    saveTabsToFirebase(updated);
  };

  const handleEditTab = (tabId, newName) => {
    setTabs(prev => {
      const updated = prev.map(tab => tab.id === tabId ? { ...tab, name: newName } : tab);
      saveTabsToFirebase(updated);
      return updated;
    });
    toast.success('تم تعديل التبويب بنجاح ✏️');
  };

  const handleDeleteTab = (tabId) => {
    showDeleteConfirm('هل أنت متأكد من حذف هذا التبويب وكل محتوياته؟', () => {
      setTabs(prev => {
        const updated = prev.filter(tab => tab.id !== tabId);
        saveTabsToFirebase(updated);
        if (activeTabId === tabId) {
          setActiveTabId(updated.length > 0 ? updated[0].id : '');
        }
        return updated;
      });
      toast.success('تم حذف التبويب بنجاح 🗑️');
    });
  };



  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!currentTask.text.trim()) return;

    updateTabContent(tab => {
      const taskData = {
        text: currentTask.text.trim(),
        date: currentTask.date,
        time: currentTask.time,
        estimatedHours: Number(currentTask.estimatedHours) || 0,
        priority: currentTask.priority,
        taskNote: currentTask.taskNote || '',
        taskLink: currentTask.taskLink || '',
        subtasks: currentTask.subtasks || []
      };

      if (taskFormMode === 'add') {
        return { ...tab, content: [...tab.content, { id: Date.now().toString(), completed: false, ...taskData }] };
      } else {
        return { ...tab, content: tab.content.map(t => t.id === currentTask.id ? { ...t, ...taskData } : t) };
      }
    });

    toast.success(taskFormMode === 'add' ? 'تمت إضافة المهمة ✅' : 'تم حفظ التعديلات ✅');
    resetTaskForm();
  };

  const handleToggleSubtask = (taskId, subtaskId) => {
    updateTabContent(tab => ({
      ...tab,
      content: tab.content.map(t => {
        if (t.id === taskId) {
          const subtasks = (t.subtasks || []).map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks };
        }
        return t;
      })
    }));
  };

  const handleReorderTasks = (newTasks) => {
    updateTabContent(tab => ({ ...tab, content: newTasks }));
  };

  const handleReorderNotes = (newNotes) => {
    updateTabContent(tab => ({ ...tab, content: newNotes }));
  };

  const handleReorderTabs = (newTabs) => {
    setTabs(newTabs);
    saveTabsToFirebase(newTabs);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!currentNote.text.trim()) return;

    updateTabContent(tab => {
      const noteData = {
        text: currentNote.text.trim(),
        priority: currentNote.priority || 'none',
        link: currentNote.link || '',
      };

      if (noteFormMode === 'add') {
        const newNote = { id: Date.now().toString(), date: getLocalDateString(), ...noteData };
        return { ...tab, content: [newNote, ...tab.content] };
      } else {
        return { ...tab, content: tab.content.map(n => n.id === currentNote.id ? { ...n, ...noteData } : n) };
      }
    });

    toast.success(noteFormMode === 'add' ? 'تمت إضافة الملاحظة 📝' : 'تم حفظ التعديلات 📝');
    setCurrentNote({ id: null, text: '', priority: 'none', link: '' });
    setNoteFormMode('none');
  };

  const handleToggleTaskClick = (task) => {
    if (task.completed) {
      updateTabContent(tab => ({
        ...tab,
        content: tab.content.map(t => t.id === task.id ? { ...t, completed: false } : t)
      }));
    } else {
      setCompletionModal({
        show: true,
        taskId: task.id,
        spent: task.spentHours || task.estimatedHours || '',
        estimated: task.estimatedHours || 0
      });
    }
  };

  const confirmTaskCompletion = (spentValue) => {
    updateTabContent(tab => ({
      ...tab,
      content: tab.content.map(t =>
        t.id === completionModal.taskId
          ? { ...t, completed: true, spentHours: Number(spentValue) || 0 }
          : t
      )
    }));
    setCompletionModal({ show: false, taskId: null, spent: '', estimated: 0 });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleDeleteItem = (itemId) => {
    showDeleteConfirm('هل أنت متأكد من الحذف؟', () => {
      updateTabContent(tab => ({ ...tab, content: tab.content.filter(item => item.id !== itemId) }));
      setSelectedIds(prev => prev.filter(id => id !== itemId));
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    showDeleteConfirm(`حذف ${selectedIds.length} عنصر نهائياً؟`, () => {
      updateTabContent(tab => ({
        ...tab,
        content: tab.content.filter(item => !selectedIds.includes(item.id))
      }));
      setSelectedIds([]);
      setIsSelectionMode(false);
      toast.success('تم الحذف المتعدد بنجاح 🗑️');
    });
  };

  const toggleSelection = (itemId) => {
    setSelectedIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleOpenPomodoro = (task) => {
    setPomodoroModal({ show: true, task });
  };

  const handleUpdateTaskTime = (taskId, spentHours) => {
    updateTabContent(tab => ({
      ...tab,
      content: tab.content.map(t =>
        t.id === taskId
          ? { ...t, spentHours: Number(((t.spentHours || 0) + spentHours).toFixed(2)) }
          : t
      )
    }));
  };

  const handleCompleteTaskFromPomodoro = (taskId, spentHours) => {
    updateTabContent(tab => ({
      ...tab,
      content: tab.content.map(t =>
        t.id === taskId
          ? { ...t, completed: true, spentHours: Number(((t.spentHours || 0) + spentHours).toFixed(2)) }
          : t
      )
    }));
    playTaskCompleteSound();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const resetTaskForm = () => {
    setCurrentTask({ text: '', date: getLocalDateString(), time: '', estimatedHours: '', priority: 'none', taskNote: '', taskLink: '' });
    setTaskFormMode('none');
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-32px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">جاري تحميل مساحة العمل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 md:h-[calc(100vh-32px)] gap-4 pb-20 md:pb-0">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} />
        </div>
      )}

      <CompletionModal
        modal={completionModal}
        onConfirm={confirmTaskCompletion}
        onCancel={() => setCompletionModal({ show: false, taskId: null, spent: '', estimated: 0 })}
      />

      {/* Header */}
      <ProjectHeader
        project={project}
        onNavigateBack={() => navigate('/projects')}
        isSelectionMode={isSelectionMode}
        setIsSelectionMode={(val) => {
          setIsSelectionMode(val);
          if (!val) setSelectedIds([]);
        }}
        selectedIds={selectedIds}
        handleBulkDelete={handleBulkDelete}
      />

      {/* Body */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <ProjectSidebar
          tabs={tabs}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          onAddTab={handleAddTab}
          onEditTab={handleEditTab}
          onDeleteTab={handleDeleteTab}
          onReorderTabs={handleReorderTabs}
        />

        {/* Main Content */}
        <main className="flex-1 glass-panel p-3.5 sm:p-5 flex flex-col min-h-0 md:overflow-hidden">
          {activeTab ? (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* Tab Header */}
              <div className="flex justify-between items-center shrink-0">
                <h2 className="text-xl text-slate-50 font-medium">{activeTab.name}</h2>
                <div className="flex items-center gap-2">
                  {activeTab.type === 'tasks' && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-sm transition-colors"
                      onClick={() => handleOpenPomodoro(null)}
                      title="بدء مؤقت تركيز حر"
                    >
                      <Clock size={16} />
                      <span className="hidden sm:inline">جلسة تركيز ⏳</span>
                    </button>
                  )}
                  <button
                    className="btn-primary flex items-center gap-2 py-2 text-sm"
                    onClick={() => {
                      if (activeTab.type === 'tasks') {
                        if (taskFormMode === 'add') {
                          resetTaskForm();
                        } else {
                          resetTaskForm();
                          setTaskFormMode('add');
                        }
                      } else {
                        if (noteFormMode === 'add') {
                          setCurrentNote({ id: null, text: '', priority: 'none', link: '' });
                          setNoteFormMode('none');
                        } else {
                          setCurrentNote({ id: null, text: '', priority: 'none', link: '' });
                          setNoteFormMode('add');
                        }
                      }
                    }}
                  >
                    <Plus size={16} /> إضافة {activeTab.type === 'tasks' ? 'مهمة' : 'ملاحظة'}
                  </button>
                </div>
              </div>

              {/* Task Form */}
              {activeTab.type === 'tasks' && taskFormMode !== 'none' && (
                <TaskForm
                  taskFormMode={taskFormMode}
                  currentTask={currentTask}
                  setCurrentTask={setCurrentTask}
                  handleSaveTask={handleSaveTask}
                  resetTaskForm={resetTaskForm}
                />
              )}

              {/* Note Form */}
              {activeTab.type === 'notes' && noteFormMode !== 'none' && (
                <NoteForm
                  noteFormMode={noteFormMode}
                  currentNote={currentNote}
                  setCurrentNote={setCurrentNote}
                  handleSaveNote={handleSaveNote}
                  resetNoteForm={() => { setCurrentNote({ id: null, text: '', priority: 'none', link: '' }); setNoteFormMode('none'); }}
                />
              )}

              {/* Content List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-4">
                {activeTab.type === 'tasks' ? (
                  <TaskTabContent
                    tasks={activeTab.content}
                    activeTaskFilter={activeTaskFilter}
                    setActiveTaskFilter={setActiveTaskFilter}
                    isSelectionMode={isSelectionMode}
                    selectedIds={selectedIds}
                    toggleSelection={toggleSelection}
                    handleToggleTaskClick={handleToggleTaskClick}
                    setCurrentTask={setCurrentTask}
                    setTaskFormMode={setTaskFormMode}
                    handleDeleteItem={handleDeleteItem}
                    handleOpenPomodoro={handleOpenPomodoro}
                    onToggleSubtask={handleToggleSubtask}
                    onReorderTasks={handleReorderTasks}
                  />
                ) : (
                  <NoteTabContent
                    notes={activeTab.content}
                    isSelectionMode={isSelectionMode}
                    selectedIds={selectedIds}
                    toggleSelection={toggleSelection}
                    setCurrentNote={setCurrentNote}
                    setNoteFormMode={setNoteFormMode}
                    handleDeleteItem={handleDeleteItem}
                    onReorderNotes={handleReorderNotes}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center flex-col gap-4 text-slate-500">
              <Folder size={48} className="opacity-30" />
              <p className="text-sm">اختر تبويباً أو أنشئ واحداً جديداً من القائمة اليسرى.</p>
            </div>
          )}
        </main>
      </div>

      {/* Pomodoro Focus Timer Modal */}
      <PomodoroModal
        isOpen={pomodoroModal.show}
        onClose={() => setPomodoroModal({ show: false, task: null })}
        task={pomodoroModal.task}
        initialMinutes={pomodoroModal.task?.estimatedHours ? Math.round(pomodoroModal.task.estimatedHours * 60) : 25}
        onUpdateTaskTime={handleUpdateTaskTime}
        onCompleteTask={handleCompleteTaskFromPomodoro}
      />
    </div>
  );
};

export default ProjectWorkspace;
