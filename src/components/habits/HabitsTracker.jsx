import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Activity, ChevronRight, Archive, CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../../utils/toastUtils';
import { handleFirestoreError } from '../../utils/firestoreErrorUtils';
import HabitItem from './HabitItem';
import HabitDetails from './HabitDetails';
import PomodoroModal from '../PomodoroModal';
import { getLocalDateString } from '../../utils/dateUtils';
import { HABIT_COLORS as COLORS } from '../../utils/habitColors';


const DAYS_OF_WEEK = [
  { id: 0, name: 'الأحد' },
  { id: 1, name: 'الإثنين' },
  { id: 2, name: 'الثلاثاء' },
  { id: 3, name: 'الأربعاء' },
  { id: 4, name: 'الخميس' },
  { id: 5, name: 'الجمعة' },
  { id: 6, name: 'السبت' },
];

const HabitsTracker = () => {
  const { currentUser } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [pomodoroModal, setPomodoroModal] = useState({ show: false, habit: null });
  
  // Form State
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].id);
  const [selectedFrequency, setSelectedFrequency] = useState([0, 1, 2, 3, 4, 5, 6]); // All days by default

  // Generate last 35 days (5 weeks)
  const last35Days = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(getLocalDateString(d));
    }
    return days;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'habits'), where('userId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setHabits(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    const cleanName = newHabitName.trim();
    if (!cleanName) return;

    if (cleanName.length > 100) {
      return toast.error('اسم العادة يجب ألا يتجاوز 100 حرف.');
    }

    if (selectedFrequency.length === 0) {
      toast.error('يجب اختيار يوم واحد على الأقل.');
      return;
    }

    try {
      await addDoc(collection(db, 'habits'), {
        userId: currentUser.uid,
        name: cleanName,
        color: selectedColor,
        completedDates: [],
        frequency: selectedFrequency,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewHabitName('');
      setSelectedFrequency([0, 1, 2, 3, 4, 5, 6]);
      setIsAdding(false);
      toast.success('تمت إضافة العادة بنجاح 🎯');
    } catch (err) {
      handleFirestoreError(err, 'حدث خطأ أثناء إضافة العادة.');
    }
  };

  const handleDeleteHabit = (habitId) => {
    showDeleteConfirm('هل تريد حذف هذه العادة نهائياً؟', async () => {
      await deleteDoc(doc(db, 'habits', habitId));
      if (selectedHabitId === habitId) setSelectedHabitId(null);
    }, 'تم الحذف 🗑️');
  };

  const toggleHabitArchive = async (habitId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'habits', habitId), { 
        archived: !currentStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(!currentStatus ? 'تم أرشفة العادة 📦' : 'تم استرجاع العادة 🔄');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const toggleHabitDate = async (habitId, dateStr, currentDates) => {
    const isCompleted = currentDates?.includes(dateStr);
    let newDates = [];
    if (isCompleted) {
      newDates = currentDates.filter(d => d !== dateStr);
    } else {
      newDates = [...(currentDates || []), dateStr];
    }

    try {
      await updateDoc(doc(db, 'habits', habitId), { 
        completedDates: newDates,
        updatedAt: serverTimestamp()
      });
    } catch {
      toast.error('لم يتم الحفظ');
    }
  };

  const handleEditHabitName = async (habitId, newName) => {
    const cleanName = (newName || '').trim();
    if (!cleanName) return;
    if (cleanName.length > 100) {
      return toast.error('اسم العادة يجب ألا يتجاوز 100 حرف.');
    }
    try {
      await updateDoc(doc(db, 'habits', habitId), {
        name: cleanName,
        updatedAt: serverTimestamp()
      });
      toast.success('تم تعديل اسم العادة بنجاح ✏️');
    } catch (err) {
      handleFirestoreError(err, 'حدث خطأ أثناء تعديل اسم العادة.');
    }
  };

  const calculateStreak = (habit) => {
    if (!habit.completedDates || habit.completedDates.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Move backwards day by day
    while (true) {
      const dateStr = getLocalDateString(currentDate);
      const dayOfWeek = currentDate.getDay();
      
      const isRequired = !habit.frequency || habit.frequency.includes(dayOfWeek);
      const isCompleted = habit.completedDates.includes(dateStr);

      if (isCompleted) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (!isRequired) {
        // If not required, skip without breaking the streak
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If it was required and not completed
        const todayStr = getLocalDateString();
        if (dateStr === todayStr && streak === 0) {
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break; // Streak broken
        }
      }
    }
    return streak;
  };

  if (loading) {
    return (
      <div className="glass-panel p-10 text-center">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">جاري التحميل...</p>
      </div>
    );
  }

  // View: Habit Details
  if (selectedHabitId) {
    const habit = habits.find(h => h.id === selectedHabitId);
    if (!habit) return null;
    const colorObj = COLORS.find(c => c.id === habit.color) || COLORS[0];
    return (
      <HabitDetails 
        habit={habit} 
        onBack={() => setSelectedHabitId(null)} 
        colorObj={colorObj} 
        currentStreak={calculateStreak(habit)} 
        onEditName={handleEditHabitName}
      />
    );
  }

  const handleStartHabitPomodoro = (habit) => {
    setPomodoroModal({ show: true, habit });
  };

  const handleCompleteHabitFromPomodoro = async (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const todayStr = getLocalDateString();
    const currentCompleted = habit.completedDates || [];
    if (!currentCompleted.includes(todayStr)) {
      await toggleHabitDate(habitId, todayStr, currentCompleted);
    }
  };

  // View: Main List
  const activeHabits = habits.filter(h => !h.archived);
  const archivedHabits = habits.filter(h => h.archived);
  const displayedHabits = activeTab === 'active' ? activeHabits : archivedHabits;

  return (
    <div className="flex flex-col gap-6 animate-slideDown">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex bg-black/20 p-1 rounded-xl border border-glass-border">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'active' ? 'bg-accent-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('active')}
          >
            <CheckCircle size={16} /> نشطة ({activeHabits.length})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'archived' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('archived')}
          >
            <Archive size={16} /> مؤرشفة ({archivedHabits.length})
          </button>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus size={16} /> إضافة عادة
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddHabit} className="glass-panel p-5 border-accent-primary/30 flex flex-col gap-5 animate-slideDown">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400">اسم العادة (مثال: قراءة، رياضة، برمجة)</label>
            <input
              type="text"
              className="input-glass text-base py-2.5"
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              placeholder="اكتب اسم العادة..."
              maxLength={100}
              required
              autoFocus
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400">أيام التكرار</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedFrequency.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedFrequency(prev => prev.filter(id => id !== day.id));
                      } else {
                        setSelectedFrequency(prev => [...prev, day.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                      isSelected 
                        ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/50' 
                        : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10'
                    }`}
                  >
                    {day.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400">اللون المميز</label>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-8 h-8 rounded-full ${c.hex} transition-all ${selectedColor === c.id ? `ring-2 ring-white ring-offset-2 ring-offset-[#0a0e1a] ${c.glow}` : 'opacity-50 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-glass-border">
            <button type="button" className="btn-secondary text-sm px-4" onClick={() => setIsAdding(false)}>إلغاء</button>
            <button type="submit" className="btn-primary text-sm px-6">حفظ</button>
          </div>
        </form>
      )}

      {displayedHabits.length === 0 && !isAdding ? (
        <div className="glass-panel p-10 text-center border-dashed border-2 border-glass-border">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${activeTab === 'active' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-amber-500/10 text-amber-500'}`}>
            {activeTab === 'active' ? <Activity size={28} className="opacity-60" /> : <Archive size={28} className="opacity-60" />}
          </div>
          <p className="text-slate-400 mb-5">
            {activeTab === 'active' ? 'ليس لديك أي عادات مسجلة بعد' : 'لا توجد عادات مؤرشفة'}
          </p>
          {activeTab === 'active' && (
            <button className="btn-primary inline-flex items-center gap-2" onClick={() => setIsAdding(true)}>
              <Plus size={16} /> أضف أول عادة
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayedHabits.map(habit => {
            const habitColorObj = COLORS.find(c => c.id === habit.color) || COLORS[0];
            return (
              <HabitItem
                key={habit.id}
                habit={habit}
                colorObj={habitColorObj}
                last35Days={last35Days}
                currentStreak={calculateStreak(habit)}
                onToggleDate={toggleHabitDate}
                onDelete={handleDeleteHabit}
                onArchive={toggleHabitArchive}
                onShowDetails={() => setSelectedHabitId(habit.id)}
                onStartPomodoro={handleStartHabitPomodoro}
                onEditName={handleEditHabitName}
              />
            );
          })}
        </div>
      )}

      {/* Habit Pomodoro Modal */}
      <PomodoroModal
        isOpen={pomodoroModal.show}
        onClose={() => setPomodoroModal({ show: false, habit: null })}
        habit={pomodoroModal.habit}
        onCompleteHabit={handleCompleteHabitFromPomodoro}
      />
    </div>
  );
};

export default HabitsTracker;
