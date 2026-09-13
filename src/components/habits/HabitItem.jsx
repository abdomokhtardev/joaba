import React, { useMemo, useEffect, useState } from 'react';
import { Trash2, Check, Archive, ArrowLeft, Clock, Edit2, X } from 'lucide-react';
import Confetti from 'react-confetti';
import { getLocalDateString, formatArabicDate } from '../../utils/dateUtils';
import { playHabitClickSound } from '../../utils/audioUtils';
import { resolveHabitColorConfig } from '../../utils/habitColors';

const HabitItem = ({ habit, colorObj, last35Days, currentStreak, onToggleDate, onDelete, onArchive, onShowDetails, onStartPomodoro, onEditName }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);

  const colorConfig = useMemo(
    () => resolveHabitColorConfig(habit.color, colorObj),
    [habit.color, colorObj]
  );

  // Keep local edit name updated if habit changes
  useEffect(() => {
    setEditName(habit.name);
  }, [habit.name]);

  // Check for streak milestones to trigger confetti
  useEffect(() => {
    if (currentStreak === 7 || currentStreak === 30 || currentStreak === 100) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStreak]);

  // Calculate Monthly Progress (last 30 days completion rate)
  const monthlyProgress = useMemo(() => {
    const last30 = last35Days.slice(5); // first 5 are older, last 30 are recent
    let completed = 0;
    last30.forEach(day => {
      if (habit.completedDates?.includes(day)) completed++;
    });
    return Math.round((completed / 30) * 100);
  }, [last35Days, habit.completedDates]);

  const handleSaveEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="glass-panel p-4 hover:border-white/10 transition-colors relative">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-xl">
          <Confetti width={500} height={200} recycle={false} numberOfPieces={200} />
        </div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              className="input-glass text-sm py-1 px-3 flex-1 min-w-0"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={100}
            />
            <button
              type="submit"
              className="text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded-lg transition-colors shrink-0"
              title="حفظ الاسم"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditName(habit.name);
                setIsEditing(false);
              }}
              className="text-slate-400 bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors shrink-0"
              title="إلغاء"
            >
              <X size={16} />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={onShowDetails}>
            <div className={`w-3 h-3 rounded-full shrink-0 ${colorObj.hex} ${colorObj.glow}`} />
            <h3 className="text-slate-50 font-medium text-lg group-hover:text-accent-primary transition-colors flex items-center gap-2 truncate" title={habit.name}>
              {habit.name}
              <ArrowLeft size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </h3>
            <span className="bg-white/5 text-slate-400 text-xs px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
              🔥 {currentStreak} أيام متتالية
            </span>
            {habit.archived && (
              <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-1 rounded-md border border-amber-500/20 shrink-0">
                مؤرشفة
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* Monthly Progress Bar */}
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <span className="text-xs text-slate-500">إنجاز الشهر:</span>
            <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className={`h-full ${colorObj.hex} transition-all duration-1000`}
                style={{ width: `${monthlyProgress}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{monthlyProgress}%</span>
          </div>

          {onStartPomodoro && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartPomodoro(habit);
              }}
              className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-lg text-xs transition-colors border border-indigo-500/20 font-medium"
              title="بدء جلسة تركيز للعادة"
            >
              <Clock size={13} />
              <span className="hidden sm:inline">جلسة تركيز ⏳</span>
            </button>
          )}

          {onEditName && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditName(habit.name);
                setIsEditing(!isEditing);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="تعديل اسم العادة"
            >
              <Edit2 size={16} />
            </button>
          )}

          <button
            onClick={() => onArchive(habit.id, habit.archived)}
            className={`p-1.5 rounded-lg transition-colors ${habit.archived ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            title={habit.archived ? "إلغاء الأرشفة" : "أرشفة العادة"}
          >
            <Archive size={16} />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
            title="حذف العادة"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Heatmap Grid (35 Days) */}
      <div className="overflow-x-auto pb-2 custom-scrollbar" dir="ltr">
        <div className="flex gap-1.5 min-w-max justify-end py-1">
          {last35Days.map(dateStr => {
            const isCompleted = habit.completedDates?.includes(dateStr);
            const isToday = dateStr === getLocalDateString();

            // Check if day is part of frequency (0 = Sunday, 1 = Monday...)
            const dayOfWeek = new Date(dateStr).getDay();
            const isRequired = !habit.frequency || habit.frequency.includes(dayOfWeek);
            const dateInfo = formatArabicDate(dateStr);

            let todayStyle = undefined;
            if (isToday && isRequired) {
              if (isCompleted) {
                todayStyle = {
                  boxShadow: `0 0 0 2px rgba(255, 255, 255, 0.95), 0 0 22px rgba(${colorConfig.rgb}, 0.95)`,
                };
              } else {
                todayStyle = {
                  boxShadow: `0 0 0 2px ${colorConfig.colorHex}, 0 0 20px rgba(${colorConfig.rgb}, 0.9)`,
                  borderColor: colorConfig.colorHex,
                  backgroundColor: `rgba(${colorConfig.rgb}, 0.22)`,
                };
              }
            }

            return (
              <button
                key={dateStr}
                title={isToday ? `اليوم (اضغط لتسجيل الإنجاز) - ${dateInfo.full}` : dateInfo.full}
                onClick={() => {
                  if (isRequired) {
                    playHabitClickSound();
                    onToggleDate(habit.id, dateStr, habit.completedDates);
                  }
                }}
                disabled={!isRequired}
                style={todayStyle}
                className={`w-6 h-6 md:w-8 md:h-8 rounded-md transition-all duration-300 flex items-center justify-center shrink-0 relative
                  ${!isRequired ? 'bg-black/20 opacity-30 cursor-not-allowed border border-dashed border-glass-border' :
                    isCompleted ? `${colorObj.hex} ${colorObj.glow}` : 'bg-white/5 hover:bg-white/10 border border-glass-border'
                  }
                  ${isToday && isRequired ? (
                    isCompleted 
                      ? 'scale-110 z-10' 
                      : 'animate-pulse scale-110 z-10'
                  ) : ''}
                `}
              >
                {isCompleted ? (
                  <Check size={12} className="text-white opacity-95 stroke-[2.5]" />
                ) : isToday && isRequired ? (
                  <span 
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{
                      backgroundColor: colorConfig.colorHex,
                      boxShadow: `0 0 8px ${colorConfig.colorHex}`,
                    }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-1" dir="rtl">
          <span 
            className="flex items-center gap-1.5 font-bold transition-colors"
            style={{ color: colorConfig.colorHex }}
          >
            <span 
              className="w-2 h-2 rounded-full animate-ping inline-block"
              style={{
                backgroundColor: colorConfig.colorHex,
                boxShadow: `0 0 8px ${colorConfig.colorHex}`,
              }}
            />
            اليوم (متوهج)
          </span>
          <span>منذ 35 يوم</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HabitItem);
