import React, { useState } from 'react';
import { TrendingUp, Award, Zap, Clock, Volume2, VolumeX, BarChart2 } from 'lucide-react';
import { ARABIC_DAYS, getLocalDateString } from '../utils/dateUtils';
import { isSoundEnabled, setSoundEnabled } from '../utils/audioUtils';
import toast from 'react-hot-toast';

const ProductivityInsights = ({ projects = [], habits = [], journals = [] }) => {
  const [soundActive, setSoundActive] = useState(isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    toast.success(next ? 'تم تفعيل المؤثرات الصوتية 🔊' : 'تم كتم المؤثرات الصوتية 🔇');
  };

  // Calculate Last 7 Days dates
  const last7Days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last7Days.push({
      dateStr: getLocalDateString(d),
      dayName: ARABIC_DAYS[d.getDay()],
      shortName: ARABIC_DAYS[d.getDay()].substring(0, 3),
      tasksCount: 0,
      habitsCount: 0,
      spentHours: 0
    });
  }

  // Extract all tasks across all projects
  let totalTasksCompleted = 0;
  let totalSpentHours = 0;
  const priorityBreakdown = {
    'urgent-important': 0,
    'important': 0,
    'urgent': 0,
    'none': 0
  };

  projects.forEach((proj) => {
    if (!proj.tabs) return;
    proj.tabs.forEach((tab) => {
      if (tab.type === 'tasks' && Array.isArray(tab.content)) {
        tab.content.forEach((t) => {
          if (t.completed) {
            totalTasksCompleted += 1;
            totalSpentHours += Number(t.spentHours || 0);

            if (priorityBreakdown[t.priority] !== undefined) {
              priorityBreakdown[t.priority] += 1;
            }

            // Check if matches one of last 7 days
            if (t.date) {
              const dayMatch = last7Days.find((d) => d.dateStr === t.date);
              if (dayMatch) {
                dayMatch.tasksCount += 1;
                dayMatch.spentHours += Number(t.spentHours || 0);
              }
            }
          }
        });
      }
    });
  });

  // Calculate habit completions in the last 7 days
  let totalHabitsDoneThisWeek = 0;
  habits.forEach((h) => {
    if (Array.isArray(h.completedDates)) {
      last7Days.forEach((d) => {
        if (h.completedDates.includes(d.dateStr)) {
          d.habitsCount += 1;
          totalHabitsDoneThisWeek += 1;
        }
      });
    }
  });

  // Find most productive day
  let bestDay = last7Days[0];
  last7Days.forEach((d) => {
    const totalScore = d.tasksCount + d.habitsCount;
    const bestScore = bestDay.tasksCount + bestDay.habitsCount;
    if (totalScore > bestScore) {
      bestDay = d;
    }
  });

  const maxDailyScore = Math.max(1, ...last7Days.map((d) => d.tasksCount + d.habitsCount));

  return (
    <div className="glass-panel p-6 flex flex-col gap-6 relative overflow-hidden border border-glass-border">
      {/* Header with sound toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-glass-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary shrink-0">
            <BarChart2 size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
              <span>تحليلات الإنتاجية الأسبوعية</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-normal border border-emerald-500/20">
                آخر 7 أيام
              </span>
            </h2>
            <p className="text-xs text-slate-400">متابعة نشاطك ومعدل إنجازك الأسبوعي في مكان واحد.</p>
          </div>
        </div>

        <button
          onClick={handleToggleSound}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border text-xs text-slate-300 transition-colors self-start sm:self-center"
          title={soundActive ? 'كتم الصوت' : 'تفعيل الصوت'}
        >
          {soundActive ? <Volume2 size={15} className="text-emerald-400" /> : <VolumeX size={15} className="text-slate-500" />}
          <span>{soundActive ? 'الأصوات مفعلة' : 'الأصوات مكتومة'}</span>
        </button>
      </div>

      {/* 3 Quick Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-glass-border p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">ساعات التركيز الكلية</p>
            <p className="text-xl font-black text-slate-100">{totalSpentHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">ساعة</span></p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-glass-border p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">العادات المكتملة بالأسبوع</p>
            <p className="text-xl font-black text-slate-100">{totalHabitsDoneThisWeek} <span className="text-xs font-normal text-slate-400">إنجاز</span></p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-glass-border p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">اليوم الأكثر إنتاجية</p>
            <p className="text-lg font-bold text-slate-100">{bestDay.dayName}</p>
          </div>
        </div>
      </div>

      {/* 7-Day Activity Chart & Eisenhower Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left: 7-Day Activity Chart (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-accent-primary" />
            نشاط الإنجاز اليومي (مهام + عادات)
          </h3>

          <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-1 px-2 bg-black/20 rounded-xl border border-glass-border">
            {last7Days.map((day) => {
              const totalScore = day.tasksCount + day.habitsCount;
              const barHeight = Math.max(12, Math.round((totalScore / maxDailyScore) * 100));
              const isBest = day.dateStr === bestDay.dateStr && totalScore > 0;

              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {totalScore}
                  </span>
                  <div
                    style={{ height: `${barHeight}%` }}
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                      isBest
                        ? 'bg-gradient-to-t from-accent-primary to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                        : totalScore > 0
                        ? 'bg-gradient-to-t from-emerald-500/50 to-emerald-400'
                        : 'bg-white/5'
                    }`}
                  />
                  <span className="text-[11px] text-slate-400 font-medium">{day.shortName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Eisenhower Priority Breakdown (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            توزيع المهام حسب مصفوفة الأولويات
          </h3>

          <div className="flex flex-col gap-2.5 bg-black/20 p-3 rounded-xl border border-glass-border">
            {[
              { key: 'urgent-important', label: 'مهم وعاجل', count: priorityBreakdown['urgent-important'], color: 'bg-red-500', barBg: 'bg-red-500/20' },
              { key: 'important', label: 'مهم', count: priorityBreakdown['important'], color: 'bg-amber-500', barBg: 'bg-amber-500/20' },
              { key: 'urgent', label: 'عاجل', count: priorityBreakdown['urgent'], color: 'bg-blue-500', barBg: 'bg-blue-500/20' },
              { key: 'none', label: 'عادي', count: priorityBreakdown['none'], color: 'bg-slate-500', barBg: 'bg-slate-500/20' },
            ].map((p) => {
              const pct = totalTasksCompleted > 0 ? Math.round((p.count / totalTasksCompleted) * 100) : 0;
              return (
                <div key={p.key} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${p.color}`} />
                      <span>{p.label}</span>
                    </span>
                    <span className="font-mono text-slate-400">{p.count} ({pct}%)</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${p.barBg} overflow-hidden`}>
                    <div style={{ width: `${pct}%` }} className={`h-full ${p.color} transition-all duration-500`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityInsights;
