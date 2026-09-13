import React, { useState, useEffect } from 'react';
import { Plus, Folder, Archive, Check, Calendar, Trash2, Edit2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../utils/toastUtils';
import { handleFirestoreError } from '../utils/firestoreErrorUtils';

const ProjectsHub = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('active');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = [];
      snapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() });
      });
      projectsData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setProjects(projectsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    const cleanTitle = (newProjectName || '').trim();
    if (!cleanTitle || !currentUser) return;

    if (cleanTitle.length > 200) {
      return toast.error('اسم المشروع يجب ألا يتجاوز 200 حرف.');
    }

    try {
      await addDoc(collection(db, 'projects'), {
        userId: currentUser.uid,
        title: cleanTitle,
        deadline: newProjectDeadline || '',
        archived: false,
        tabs: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('تم إنشاء المشروع بنجاح! 🚀');
      setNewProjectName('');
      setNewProjectDeadline('');
      setShowAddForm(false);
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء إنشاء المشروع.');
    }
  };

  const handleEditProjectTitle = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanTitle = (editTitle || '').trim();
    if (!cleanTitle) {
      setEditingProjectId(null);
      return;
    }

    if (cleanTitle.length > 200) {
      return toast.error('اسم المشروع يجب ألا يتجاوز 200 حرف.');
    }

    try {
      await updateDoc(doc(db, 'projects', id), { 
        title: cleanTitle,
        updatedAt: serverTimestamp()
      });
      toast.success('تم تحديث اسم المشروع ✏️');
      setEditingProjectId(null);
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء التحديث.');
    }
  };

  const archiveProject = async (e, id) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'projects', id), { 
        archived: true,
        updatedAt: serverTimestamp()
      });
      toast.success('تم أرشفة المشروع 📦');
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء الأرشفة.');
    }
  };

  const deleteProject = (e, id) => {
    e.stopPropagation();
    showDeleteConfirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟', async () => {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (error) {
        handleFirestoreError(error, 'حدث خطأ أثناء الحذف.');
      }
    }, 'تم حذف المشروع 🗑️');
  };

  const filteredProjects = projects.filter(p => view === 'active' ? !p.archived : p.archived);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl text-slate-50 mb-2">المشاريع</h1>
          <p className="text-slate-400">أدر مشاريعك، حدد مواعيد الانتهاء، وراقب إنجازك.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={20} /> مشروع جديد
        </button>
      </header>

      {showAddForm && (
        <form className="glass-panel p-6 md:p-8 animate-slideDown border-accent-primary/30" onSubmit={handleAddProject}>
          <h3 className="text-2xl font-medium text-slate-50 mb-6 flex items-center gap-2">
            <Folder size={24} className="text-accent-primary" />
            إنشاء مشروع جديد
          </h3>
          <div className="flex flex-col md:flex-row gap-5 mb-6">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-slate-400 font-medium">اسم المشروع <span className="text-red-400">*</span></label>
              <input type="text" className="input-glass text-lg py-3 px-4 w-full" placeholder="مثال: تطوير تطبيق الجوال..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} maxLength={200} required autoFocus />
            </div>
            <div className="flex flex-col gap-2 md:w-1/3">
              <label className="text-sm text-slate-400 font-medium">موعد التسليم (اختياري)</label>
              <input type="date" className="input-glass text-lg py-3 px-4 w-full bg-slate-900 text-slate-100" value={newProjectDeadline} onChange={(e) => setNewProjectDeadline(e.target.value)} title="موعد التسليم (اختياري)" />
            </div>
          </div>
          <div className="flex gap-3 justify-end border-t border-glass-border pt-5">
            <button type="button" className="btn-secondary px-6" onClick={() => setShowAddForm(false)}>إلغاء</button>
            <button type="submit" className="btn-primary px-8 shadow-lg shadow-accent-primary/20">إنشاء المشروع</button>
          </div>
        </form>
      )}

      <div className="glass-panel p-1 w-fit flex">
        <button className={`px-4 py-2 rounded-xl transition-all ${view === 'active' ? 'bg-white/10 text-slate-50 shadow-md' : 'text-slate-400'}`} onClick={() => setView('active')}>المشاريع الحالية</button>
        <button className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${view === 'archived' ? 'bg-white/10 text-slate-50 shadow-md' : 'text-slate-400'}`} onClick={() => setView('archived')}>
          <Archive size={16} /> مكتملة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center text-slate-400 py-10">جاري تحميل المشاريع...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full glass-panel p-10 text-center text-slate-400">لا توجد مشاريع هنا.</div>
        ) : (
          filteredProjects.map(project => {
            // Calculate tasks
            let totalTasks = 0;
            let completedTasks = 0;
            
            if (project.tabs && project.tabs.length > 0) {
              project.tabs.forEach(tab => {
                if (tab.type === 'tasks' && tab.content) {
                  totalTasks += tab.content.length;
                  completedTasks += tab.content.filter(t => t.completed).length;
                }
              });
            }

            const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            const isCompleted = progress === 100 && totalTasks > 0;

            return (
              <div key={project.id} className="glass-panel p-6 cursor-pointer flex flex-col hover:-translate-y-1 hover:border-accent-primary/30 transition-all group relative min-w-0 overflow-hidden" onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="absolute top-4 left-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProjectId(project.id);
                      setEditTitle(project.title);
                    }}
                    title="تعديل اسم المشروع"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    onClick={(e) => deleteProject(e, project.id)}
                    title="حذف المشروع"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center mb-4 shrink-0">
                  <Folder size={24} className="text-accent-primary" />
                </div>
                
                {editingProjectId === project.id ? (
                  <form onSubmit={(e) => handleEditProjectTitle(e, project.id)} className="mb-2 flex items-center gap-2 w-full min-w-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      autoFocus
                      className="input-glass text-base py-1.5 px-3 flex-1 min-w-0"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={200}
                    />
                    <button type="submit" className="text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded-lg transition-colors shrink-0">
                      <Check size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProjectId(null)}
                      className="text-slate-400 bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </form>
                ) : (
                  <h3 
                    className="text-xl font-bold text-slate-50 mb-2 pr-1 break-words [overflow-wrap:anywhere] line-clamp-3 leading-snug" 
                    title={project.title}
                  >
                    {project.title}
                  </h3>
                )}
                
                {project.deadline ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Calendar size={14} /> التسليم: {project.deadline}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Calendar size={14} /> مفتوح (بدون موعد)
                  </div>
                )}
                
                <div className="mt-auto">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-50">{progress}% مكتمل</span>
                    <span className="text-slate-400">{completedTasks} / {totalTasks} مهمة</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-accent-primary'}`} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                {view === 'active' && isCompleted && (
                  <button className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20" onClick={(e) => archiveProject(e, project.id)}>
                    <Check size={16} /> أرشفة المشروع
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectsHub;
