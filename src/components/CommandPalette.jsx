import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, Link as LinkIcon, BookOpen, Home, User, ShieldCheck, Plus, Clock, ExternalLink, X, CornerDownLeft } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const CommandPalette = ({ isOpen, onClose }) => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const isAdmin = userData?.role === 'admin';

  // Base navigation items
  const navActions = [
    { id: 'nav-home', title: 'الصفحة الرئيسية', type: 'page', icon: Home, action: () => navigate('/') },
    { id: 'nav-projects', title: 'المشاريع ومساحات العمل', type: 'page', icon: Briefcase, action: () => navigate('/projects') },
    { id: 'nav-links', title: 'خزنة الروابط والمصادر', type: 'page', icon: LinkIcon, action: () => navigate('/links') },
    { id: 'nav-journal', title: 'اليوميات والملاحظات اليومية', type: 'page', icon: BookOpen, action: () => navigate('/journal') },
    { id: 'nav-profile', title: 'الملف الشخصي والاشتراك', type: 'page', icon: User, action: () => navigate('/profile') },
    ...(isAdmin ? [{ id: 'nav-admin', title: 'لوحة تحكم الإدارة', type: 'page', icon: ShieldCheck, action: () => navigate('/admin') }] : [])
  ];

  // Quick utility actions
  const quickActions = [
    { id: 'action-new-project', title: 'إنشاء مشروع جديد', type: 'action', icon: Plus, action: () => navigate('/projects') },
    { id: 'action-new-link', title: 'إضافة رابط إلى الخزنة', type: 'action', icon: LinkIcon, action: () => navigate('/links') },
    { id: 'action-new-journal', title: 'كتابة تدوينة في اليوميات', type: 'action', icon: BookOpen, action: () => navigate('/journal') }
  ];

  // Fetch projects and links when palette opens
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const fetchData = async () => {
      try {
        const [projSnap, linkSnap] = await Promise.all([
          getDocs(query(collection(db, 'projects'), where('userId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'links'), where('userId', '==', currentUser.uid)))
        ]);

        const pList = projSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const lList = linkSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setProjects(pList);
        setLinks(lList);
      } catch (err) {
        console.error('Error fetching command palette data:', err);
      }
    };

    fetchData();
    setSearchTerm('');
    setSelectedIndex(0);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [isOpen, currentUser]);

  // Extract tasks from projects for search
  const allTasks = projects.flatMap(p => 
    (p.tabs || []).flatMap(tab => 
      (tab.content || []).map(task => ({
        id: `task-${p.id}-${task.id}`,
        taskId: task.id,
        projectId: p.id,
        projectTitle: p.title,
        tabName: tab.name,
        title: task.text || task.title || '',
        completed: task.completed
      }))
    )
  );

  // Compute filtered results
  const term = searchTerm.trim().toLowerCase();

  const filteredNav = navActions.filter(item => item.title.toLowerCase().includes(term));
  const filteredActions = quickActions.filter(item => item.title.toLowerCase().includes(term));
  
  const filteredProjects = projects
    .filter(p => p.title?.toLowerCase().includes(term))
    .slice(0, 5)
    .map(p => ({
      id: `proj-${p.id}`,
      title: p.title,
      subtitle: `${(p.tabs || []).length} تبويبات`,
      type: 'project',
      icon: Briefcase,
      action: () => navigate(`/projects/${p.id}`)
    }));

  const filteredTasks = term
    ? allTasks
        .filter(t => t.title.toLowerCase().includes(term))
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          title: t.title,
          subtitle: `مشروع: ${t.projectTitle} • ${t.tabName}`,
          type: 'task',
          icon: Clock,
          completed: t.completed,
          action: () => navigate(`/projects/${t.projectId}`)
        }))
    : [];

  const filteredLinks = term
    ? links
        .filter(l => l.title?.toLowerCase().includes(term) || l.url?.toLowerCase().includes(term))
        .slice(0, 5)
        .map(l => ({
          id: `link-${l.id}`,
          title: l.title,
          subtitle: l.url,
          type: 'link',
          icon: ExternalLink,
          action: () => {
            window.open(l.url.startsWith('http') ? l.url : `https://${l.url}`, '_blank');
          }
        }))
    : [];

  const combinedResults = [
    ...filteredNav,
    ...filteredProjects,
    ...filteredTasks,
    ...filteredLinks,
    ...filteredActions
  ];

  // Keyboard navigation inside results
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (combinedResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + combinedResults.length) % (combinedResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedResults[selectedIndex]) {
        combinedResults[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-glass-border relative bg-white/[0.02]">
          <Search size={20} className="text-accent-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-base focus:outline-none"
            placeholder="ابحث عن مهمة، مشروع، رابط، أو اكتب أمراً للتنقل السريع..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-500 hover:text-slate-300 p-1 text-xs"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
            ESC للإغلاق
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 flex flex-col gap-1 scrollbar-hide">
          {combinedResults.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              لم يتم العثور على أي نتائج مطابقة لـ "{searchTerm}"
            </div>
          ) : (
            combinedResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl transition-all text-right ${
                    isSelected
                      ? 'bg-accent-primary text-white shadow-md shadow-accent-primary/20'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="truncate text-right">
                      <p className={`text-sm font-medium truncate ${item.completed ? 'line-through opacity-70' : ''}`}>
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                      isSelected
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-white/5 text-slate-400 border-white/5'
                    }`}>
                      {item.type === 'page' ? 'صفحة' : item.type === 'project' ? 'مشروع' : item.type === 'task' ? 'مهمة' : item.type === 'link' ? 'رابط' : 'أمر'}
                    </span>
                    {isSelected && <CornerDownLeft size={14} className="text-white/80" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 border-t border-glass-border bg-black/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑ ↓ للتنقل</span>
            <span>↵ للاختيار</span>
          </div>
          <span>جُعْبَة • البحث السريع</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
