import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, X, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { playTimerChime } from '../utils/audioUtils';
import toast from 'react-hot-toast';

const WORK_PRESETS = [5, 10, 15, 25, 45, 60];

const DEFAULT_MODES = {
  work: { label: 'تركيز', duration: 25 * 60, color: 'text-indigo-400', ringColor: '#6366f1' },
  shortBreak: { label: 'استراحة قصيرة', duration: 5 * 60, color: 'text-emerald-400', ringColor: '#10b981' },
  longBreak: { label: 'استراحة طويلة', duration: 15 * 60, color: 'text-amber-400', ringColor: '#f59e0b' }
};

const PomodoroModal = ({
  isOpen,
  onClose,
  task,
  habit,
  initialMinutes = 25,
  onUpdateTaskTime,
  onCompleteTask,
  onCompleteHabit
}) => {
  const [workDuration, setWorkDuration] = useState(initialMinutes * 60);
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [accumulatedWorkSeconds, setAccumulatedWorkSeconds] = useState(0);

  const timerRef = useRef(null);

  // Sync initial duration when modal opens or initialMinutes changes
  useEffect(() => {
    if (isOpen) {
      const dur = (initialMinutes || 25) * 60;
      setWorkDuration(dur);
      setMode('work');
      setTimeLeft(dur);
      setIsRunning(false);
      setAccumulatedWorkSeconds(0);
    }
  }, [isOpen, initialMinutes]);

  const getModeDuration = (m, customWorkDur = workDuration) => {
    if (m === 'work') return customWorkDur;
    return DEFAULT_MODES[m].duration;
  };

  // Switch between work, shortBreak, longBreak
  const switchMode = (newMode, customWorkSec = workDuration) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getModeDuration(newMode, customWorkSec));
  };

  const handleSelectWorkMinutes = (mins) => {
    const sec = mins * 60;
    setWorkDuration(sec);
    if (mode === 'work') {
      setIsRunning(false);
      setTimeLeft(sec);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playTimerChime();

            if (mode === 'work') {
              const newSessions = completedSessions + 1;
              setCompletedSessions(newSessions);
              setAccumulatedWorkSeconds((acc) => acc + workDuration);
              
              if (habit && onCompleteHabit) {
                toast.success(`أحسنت! انتهت جلسة عادة (${habit.name}) وتم تسجيل إنجازها اليوم 🎉`);
                onCompleteHabit(habit.id);
              } else if (task && onCompleteTask) {
                toast.success(`أحسنت! تم إتمام المهمة بنجاح 🎉 حان وقت الاستراحة.`);
                const hoursSpent = Number(((accumulatedWorkSeconds + workDuration) / 3600).toFixed(2));
                onCompleteTask(task.id, hoursSpent > 0 ? hoursSpent : (task.estimatedHours || 0.5));
              } else {
                toast.success('أحسنت! انتهت جلسة التركيز 🎉 حان وقت الاستراحة.');
              }

              // Suggest break
              if (newSessions % 4 === 0) {
                switchMode('longBreak');
              } else {
                switchMode('shortBreak');
              }
            } else {
              toast.success('انتهت الاستراحة! لنعد للتركيز 🚀');
              switchMode('work');
            }
            return 0;
          }

          if (mode === 'work') {
            setAccumulatedWorkSeconds((acc) => acc + 1);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, completedSessions, workDuration, habit, onCompleteHabit]);

  if (!isOpen) return null;

  const currentModeDuration = getModeDuration(mode);
  const progress = currentModeDuration > 0
    ? ((currentModeDuration - timeLeft) / currentModeDuration) * 100
    : 0;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveAndClose = () => {
    const hoursSpent = Number((accumulatedWorkSeconds / 3600).toFixed(2));
    if (hoursSpent > 0 && task && onUpdateTaskTime) {
      onUpdateTaskTime(task.id, hoursSpent);
      toast.success(`تم حفظ ${hoursSpent} ساعة في سجل المهمة!`);
    }
    onClose();
  };

  const handleCompleteAndClose = () => {
    if (habit && onCompleteHabit) {
      onCompleteHabit(habit.id);
      toast.success(`تم إتمام عادة (${habit.name}) بنجاح!`);
      onClose();
      return;
    }

    const hoursSpent = Number((accumulatedWorkSeconds / 3600).toFixed(2));
    if (task && onCompleteTask) {
      onCompleteTask(task.id, hoursSpent > 0 ? hoursSpent : (task.spentHours || 1));
    }
    onClose();
  };

  const titleText = habit
    ? `تركيز العادة: ${habit.name}`
    : task
    ? task.text
    : 'جلسة تركيز حرة';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 relative overflow-hidden border border-glass-border shadow-2xl flex flex-col items-center text-center animate-slideDown">
        
        {/* Close button */}
        <button
          onClick={handleSaveAndClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="إغلاق"
        >
          <X size={20} />
        </button>

        {/* Header Details */}
        <div className="mb-3 max-w-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-medium mb-1.5 border border-accent-primary/20">
            <Sparkles size={13} />
            <span>{habit ? 'جلسة تركيز للعادة 🎯' : 'جلسة تركيز بومودورو ⏳'}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-50 line-clamp-1" title={titleText}>
            {titleText}
          </h3>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-glass-border mb-3 w-full justify-around">
          {Object.entries(DEFAULT_MODES).map(([key, info]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === key
                  ? 'bg-accent-primary text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>

        {/* Quick Work Duration Presets (Only in Work Mode) */}
        {mode === 'work' && (
          <div className="flex items-center gap-1.5 mb-4 flex-wrap justify-center">
            <span className="text-[11px] text-slate-400 ml-1">المدة:</span>
            {WORK_PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => handleSelectWorkMinutes(mins)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  workDuration === mins * 60
                    ? 'bg-indigo-500 text-white border-indigo-400 font-bold shadow-md shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {mins} د
              </button>
            ))}
          </div>
        )}

        {/* Circular Countdown Ring */}
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center mb-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-white/5"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke={DEFAULT_MODES[mode].ringColor}
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-mono font-black text-slate-50 tracking-wider">
              {formatTime(timeLeft)}
            </span>
            <span className={`text-xs font-medium mt-1 ${DEFAULT_MODES[mode].color}`}>
              {DEFAULT_MODES[mode].label}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => switchMode(mode)}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-glass-border transition-colors"
            title="إعادة ضبط"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                : 'bg-accent-primary hover:bg-accent-primary/90 text-white shadow-accent-primary/40'
            }`}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} className="translate-x-[-2px]" />}
          </button>

          <button
            onClick={() => {
              if (mode === 'work') switchMode('shortBreak');
              else switchMode('work');
            }}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-glass-border transition-colors"
            title="تخطي"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Accumulated Time and Finish Actions */}
        <div className="w-full pt-4 border-t border-glass-border flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Clock size={13} /> الوقت المنجز بالجلسة:
            </span>
            <strong className="text-slate-200 font-mono font-bold">
              {Math.floor(accumulatedWorkSeconds / 60)} دقيقة
            </strong>
          </div>

          {(task || habit) && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleCompleteAndClose}
                className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
              >
                <CheckCircle size={14} /> {habit ? 'إتمام العادة لليوم ✅' : 'إتمام المهمة الآن ✅'}
              </button>
              <button
                onClick={handleSaveAndClose}
                className="btn-secondary py-2 px-3 text-xs"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PomodoroModal;
