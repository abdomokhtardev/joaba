import React, { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Trophy, Star, Medal, Zap, Award, Edit2, Check, X } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';
import { resolveHabitColorConfig } from '../../utils/habitColors';

const HabitDetails = ({ habit, onBack, colorObj, currentStreak, onEditName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);

  const colorConfig = useMemo(
    () => resolveHabitColorConfig(habit.color, colorObj),
    [habit.color, colorObj]
  );

  useEffect(() => {
    setEditName(habit.name);
  }, [habit.name]);

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const clean = editName.trim();
    if (!clean) {
      setIsEditing(false);
      setEditName(habit.name);
      return;
    }
    if (onEditName) {
      onEditName(habit.id, clean);
    }
    setIsEditing(false);
  };

  // Generate a full year array (365 days) ending today
  const yearlyDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(getLocalDateString(d));
    }
    return days;
  }, []);

  const totalCompletions = habit.completedDates?.length || 0;
  
  // Basic Badges Logic
  const badges = [
    { id: 'first_step', name: 'الخطوة الأولى', icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', earned: totalCompletions >= 1 },
    { id: 'week_warrior', name: 'محارب الأسبوع', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', earned: currentStreak >= 7 || totalCompletions >= 7 },
    { id: 'month_master', name: 'سيد الشهر', icon: Medal, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30', earned: currentStreak >= 30 || totalCompletions >= 30 },
    { id: 'legend', name: 'الأسطورة', icon: Trophy, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/30', earned: currentStreak >= 100 || totalCompletions >= 100 },
  ];

  return (
    <div className="flex flex-col gap-6 animate-slideDown">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-glass-border text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <ArrowRight size={20} />
        </button>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                className="input-glass text-lg py-1 px-3 flex-1 min-w-0"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
              />
              <button
                type="submit"
                className="text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-xl transition-colors shrink-0"
                title="حفظ الاسم"
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditName(habit.name);
                  setIsEditing(false);
                }}
                className="text-slate-400 bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors shrink-0"
                title="إلغاء"
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-xl text-slate-50 font-medium flex items-center gap-3 truncate" title={habit.name}>
                <div className={`w-3 h-3 rounded-full shrink-0 ${colorObj.hex} ${colorObj.glow}`} />
                {habit.name}
              </h2>
              {onEditName && (
                <button
                  onClick={() => {
                    setEditName(habit.name);
                    setIsEditing(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  title="تعديل اسم العادة"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}
          <p className="text-slate-400 text-sm mt-1">تاريخ الإنجاز والميداليات</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">الإجمالي</p>
          <p className="text-2xl font-bold text-slate-50">{totalCompletions}</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">الاستمرارية الحالية</p>
          <p className="text-2xl font-bold text-slate-50">{currentStreak}</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">النسبة (آخر 30 يوم)</p>
          <p className="text-2xl font-bold text-slate-50">
            {Math.round((yearlyDays.slice(-30).filter(d => habit.completedDates?.includes(d)).length / 30) * 100)}%
          </p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">الأوسمة المكتسبة</p>
          <p className="text-2xl font-bold text-slate-50">{badges.filter(b => b.earned).length}</p>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="text-slate-50 font-medium mb-4 flex items-center gap-2">
          <Award size={18} className="text-accent-primary" />
          سجل الإنجاز (آخر سنة)
        </h3>
        
        {/* GitHub Style Heatmap */}
        <div className="overflow-x-auto custom-scrollbar pb-2" dir="ltr">
          <div className="flex gap-[3px] min-w-max" style={{ height: '110px' }}>
            {Array.from({ length: 52 }).map((_, colIndex) => {
              const weekDays = yearlyDays.slice(colIndex * 7, (colIndex + 1) * 7);
              return (
                <div key={colIndex} className="flex flex-col gap-[3px]">
                  {weekDays.map(dateStr => {
                    const isCompleted = habit.completedDates?.includes(dateStr);
                    const isToday = dateStr === getLocalDateString();
                    return (
                      <div
                        key={dateStr}
                        title={`${dateStr}${isToday ? ' (اليوم)' : ''}`}
                        className={`w-[12px] h-[12px] rounded-sm transition-all ${
                          isCompleted ? colorObj.hex : 'bg-white/5'
                        } ${isToday ? 'scale-125 z-10' : ''}`}
                        style={isToday ? {
                          boxShadow: `0 0 0 1.5px ${colorConfig.colorHex}, 0 0 10px rgba(${colorConfig.rgb}, 0.9)`,
                          backgroundColor: isCompleted ? undefined : `rgba(${colorConfig.rgb}, 0.3)`,
                        } : undefined}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1" dir="rtl">
            <span>منذ عام</span>
            <span>اليوم</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="text-slate-50 font-medium mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-accent-primary" />
          الميداليات والأوسمة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map(badge => {
            const Icon = badge.icon;
            return (
              <div 
                key={badge.id}
                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                  badge.earned ? `${badge.bg}` : 'bg-white/5 border-glass-border opacity-40 grayscale'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${badge.bg}`}>
                  <Icon size={24} className={badge.color} />
                </div>
                <span className="text-sm font-medium text-slate-300 text-center">{badge.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HabitDetails;
