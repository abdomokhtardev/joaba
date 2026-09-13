import React, { useEffect, useState } from 'react';
import { Target, CheckCircle, Link as LinkIcon, Briefcase, ArrowLeft, BookOpen, PenTool, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateString } from '../utils/dateUtils';

import ProductivityInsights from '../components/ProductivityInsights';

const StatCard = ({ icon: Icon, label, value, color, glowColor }) => (
  <div className="glass-panel p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-default">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${color}`} style={{ boxShadow: `0 0 15px ${glowColor}` }}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold text-slate-50 mt-0.5">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeProjects: 0,
    completedTasks: 0,
    unreadLinks: 0,
    overallProgress: 0,
    todayJournalWritten: true,
  });

  const [projectsList, setProjectsList] = useState([]);
  const [habitsList, setHabitsList] = useState([]);

  const todayStr = getLocalDateString();

  useEffect(() => {
    if (!currentUser) return;

    // Listen to projects
    const projectsQ = query(collection(db, 'projects'), where('userId', '==', currentUser.uid), where('archived', '==', false));
    const linksQ = query(collection(db, 'links'), where('userId', '==', currentUser.uid), where('archived', '==', false));
    const journalsQ = query(collection(db, 'journals'), where('userId', '==', currentUser.uid), where('date', '==', todayStr));
    const habitsQ = query(collection(db, 'habits'), where('userId', '==', currentUser.uid));

    let activeProjects = 0;
    let completedTasks = 0;
    let totalTasks = 0;

    const unsubProjects = onSnapshot(projectsQ, (snap) => {
      activeProjects = snap.size;
      completedTasks = 0;
      totalTasks = 0;

      const pList = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        pList.push({ id: docSnap.id, ...data });
        (data.tabs || []).forEach((tab) => {
          if (tab.type === 'tasks') {
            totalTasks += (tab.content || []).length;
            completedTasks += (tab.content || []).filter((t) => t.completed).length;
          }
        });
      });

      setProjectsList(pList);
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      setStats((prev) => ({ ...prev, activeProjects, completedTasks, overallProgress }));
    });

    const unsubLinks = onSnapshot(linksQ, (snap) => {
      const totalActiveLinks = snap.size;
      const urgentUnread = snap.docs.filter((d) => d.data().priority === 'urgent-important').length;
      setStats((prev) => ({ ...prev, unreadLinks: totalActiveLinks, urgentLinks: urgentUnread }));
    });

    const unsubJournals = onSnapshot(journalsQ, (snap) => {
      setStats((prev) => ({ ...prev, todayJournalWritten: !snap.empty }));
    });

    const unsubHabits = onSnapshot(habitsQ, (snap) => {
      setHabitsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubProjects();
      unsubLinks();
      unsubJournals();
      unsubHabits();
    };
  }, [currentUser]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء النور';
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Header */}
      <header>
        <h1 className="text-3xl text-slate-50 mb-1">{greeting()} 👋</h1>
        <p className="text-slate-400">إليك ملخص إنتاجيتك حتى الآن.</p>
      </header>

      {/* Urgent Reminder Banner - shown only when there are urgent links */}
      {stats.urgentLinks > 0 && (
        <button
          className="glass-panel p-4 px-5 flex items-center gap-4 border-r-4 border-priority-red bg-gradient-to-l from-priority-red/10 to-transparent text-right hover:from-priority-red/15 transition-all w-full"
          onClick={() => navigate('/links')}
        >
          <div className="w-2 h-2 rounded-full bg-priority-red animate-pulse shrink-0" />
          <div className="flex-1">
            <p className="text-slate-50 font-medium text-sm">
              لديك {stats.urgentLinks} {stats.urgentLinks === 1 ? 'رابط' : 'روابط'} مصنف(ة) (مهم وعاجل) لم تقرأه بعد
            </p>
          </div>
          <ArrowLeft size={18} className="text-slate-400 shrink-0" />
        </button>
      )}

      {/* Journal Reminder Banner */}
      {!stats.todayJournalWritten && (
        <button
          className="glass-panel p-4 px-5 flex items-center gap-4 border-r-4 border-accent-primary bg-gradient-to-l from-accent-primary/10 to-transparent text-right hover:from-accent-primary/15 transition-all w-full"
          onClick={() => navigate('/journal')}
        >
          <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0">
            <PenTool size={18} className="text-accent-primary" />
          </div>
          <div className="flex-1">
            <p className="text-slate-50 font-medium text-sm">
              لم تسجل يوميتك اليوم!
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              دوّن أفكارك وأحداث يومك لتبقى على تواصل مع نفسك.
            </p>
          </div>
          <ArrowLeft size={18} className="text-slate-400 shrink-0" />
        </button>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Briefcase} label="المشاريع النشطة" value={stats.activeProjects} color="bg-accent-primary" glowColor="rgba(99,102,241,0.4)" />
        <StatCard icon={CheckCircle} label="المهام المكتملة" value={stats.completedTasks} color="bg-emerald-600" glowColor="rgba(5,150,105,0.4)" />
        <StatCard icon={LinkIcon} label="روابط للقراءة" value={stats.unreadLinks} color="bg-priority-blue" glowColor="rgba(59,130,246,0.4)" />
        <StatCard icon={Target} label="الإنجاز الكلي" value={`${stats.overallProgress}%`} color="bg-priority-amber" glowColor="rgba(245,158,11,0.4)" />
      </div>

      {/* Weekly Productivity Insights */}
      <ProductivityInsights
        projects={projectsList}
        habits={habitsList}
      />

      {/* Quick Actions */}
      <div>
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-3">وصول سريع</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            className="glass-panel p-5 text-right hover:-translate-y-1 hover:border-accent-primary/40 transition-all"
            onClick={() => navigate('/projects')}
          >
            <Briefcase size={24} className="text-accent-primary mb-3" />
            <p className="text-slate-50 font-medium">المشاريع</p>
            <p className="text-xs text-slate-400 mt-1">إدارة مشاريعك ومهامك</p>
          </button>
          <button
            className="glass-panel p-5 text-right hover:-translate-y-1 hover:border-accent-primary/40 transition-all"
            onClick={() => navigate('/links')}
          >
            <LinkIcon size={24} className="text-accent-primary mb-3" />
            <p className="text-slate-50 font-medium">خزنة الروابط</p>
            <p className="text-xs text-slate-400 mt-1">احتفظ بروابطك وصنفها</p>
          </button>
          <button
            className="glass-panel p-5 text-right hover:-translate-y-1 hover:border-accent-primary/40 transition-all"
            onClick={() => navigate('/journal', { state: { tab: 'journal' } })}
          >
            <BookOpen size={24} className="text-accent-primary mb-3" />
            <p className="text-slate-50 font-medium">اليوميات</p>
            <p className="text-xs text-slate-400 mt-1">دوّن أفكارك وأحداث يومك</p>
          </button>
          <button
            className="glass-panel p-5 text-right hover:-translate-y-1 hover:border-accent-primary/40 transition-all"
            onClick={() => navigate('/journal', { state: { tab: 'habits' } })}
          >
            <Zap size={24} className="text-amber-400 mb-3" />
            <p className="text-slate-50 font-medium">تتبع العادات</p>
            <p className="text-xs text-slate-400 mt-1">حافظ على سلاسل استمراريتك</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
