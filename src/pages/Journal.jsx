import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, Plus, Edit2, Trash2, Activity } from 'lucide-react';
import { getLocalDateString, ARABIC_DAYS, formatArabicDate } from '../utils/dateUtils';
import HabitsTracker from '../components/habits/HabitsTracker';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../utils/toastUtils';
import { handleFirestoreError } from '../utils/firestoreErrorUtils';
import { bulkDeleteDocs } from '../utils/firestoreUtils';
import JournalForm, { MOODS } from '../components/journal/JournalForm';
import RecentEntriesList from '../components/journal/RecentEntriesList';
import JournalDateNavigator from '../components/journal/JournalDateNavigator';
import JournalEntryViewer from '../components/journal/JournalEntryViewer';

const Journal = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Top level tabs
  const [activeMainTab, setActiveMainTab] = useState('journal');

  // Handle incoming tab state / search param
  useEffect(() => {
    const queryTab = new URLSearchParams(location.search).get('tab');
    const targetTab = location.state?.tab || queryTab;
    if (targetTab === 'habits' || targetTab === 'journal') {
      setActiveMainTab(targetTab);
    }
  }, [location.state, location.search]);

  // Date navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const [journalViewMode, setJournalViewMode] = useState('daily');
  const [archiveYearOffset, setArchiveYearOffset] = useState(0);
  const today = useMemo(() => getLocalDateString(), []);
  const [selectedDate, setSelectedDate] = useState(today);

  // Form state
  const [formMode, setFormMode] = useState('none');
  const [currentEntry, setCurrentEntry] = useState({ id: null, text: '', mood: '', gratitude: '' });

  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Generate week days
  const weekDays = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() - base.getDay() + (weekOffset * 7));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(getLocalDateString(d));
    }
    return days;
  }, [weekOffset]);

  // Firestore listener
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'journals'),
      where('userId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q, 
      (snap) => {
        const data = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
        setEntries(data);
        setLoading(false);
      },
      (error) => {
        console.warn("Journal listener error:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser]);

  const selectedEntry = entries.find((e) => e.date === selectedDate);
  const entryDates = new Set(entries.map((e) => e.date));
  const dateInfo = formatArabicDate(selectedDate);
  const moodObj = selectedEntry ? MOODS.find((m) => m.key === selectedEntry.mood) : null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentEntry.text.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (formMode === 'add') {
        await addDoc(collection(db, 'journals'), {
          userId: currentUser.uid,
          date: selectedDate,
          text: currentEntry.text.trim(),
          mood: currentEntry.mood || 'good',
          gratitude: currentEntry.gratitude?.trim() || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success('تم حفظ اليومية بنجاح! 📖');
      } else if (formMode === 'edit') {
        await updateDoc(doc(db, 'journals', currentEntry.id), {
          text: currentEntry.text.trim(),
          mood: currentEntry.mood,
          gratitude: currentEntry.gratitude?.trim() || '',
          updatedAt: serverTimestamp(),
        });
        toast.success('تم تحديث اليومية 📝');
      }
      setFormMode('none');
    } catch (err) {
      handleFirestoreError(err, 'حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    setCurrentEntry({ id: null, text: '', mood: 'good', gratitude: '' });
    setFormMode('add');
  };

  const handleEdit = () => {
    if (!selectedEntry) return;
    setCurrentEntry({
      id: selectedEntry.id,
      text: selectedEntry.text,
      mood: selectedEntry.mood || 'good',
      gratitude: selectedEntry.gratitude || '',
    });
    setFormMode('edit');
  };

  const handleDelete = async (id) => {
    showDeleteConfirm('هل أنت متأكد من حذف هذه اليومية؟', async () => {
      try {
        await deleteDoc(doc(db, 'journals', id));
      } catch (err) {
        handleFirestoreError(err, 'حدث خطأ أثناء الحذف.');
      }
    }, 'تم حذف اليومية 🗑️');
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    showDeleteConfirm(`حذف ${selectedIds.length} يومية نهائياً؟`, async () => {
      try {
        await bulkDeleteDocs(db, 'journals', selectedIds);
        setSelectedIds([]);
        setIsSelectionMode(false);
      } catch (err) {
        handleFirestoreError(err, 'حدث خطأ أثناء الحذف المتعدد.');
      }
    }, 'تم الحذف بنجاح 🗑️');
  };

  const handleSelectMonthFromArchive = (targetYear, idx) => {
    const isCurrentMonth = targetYear === new Date().getFullYear() && idx === new Date().getMonth();
    let targetDate = new Date(targetYear, idx, 1);
    if (isCurrentMonth) targetDate = new Date();

    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    setSelectedDate(getLocalDateString(targetDate));

    const msPerWeek = 1000 * 60 * 60 * 24 * 7;
    const todayDate = new Date();
    todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset());
    const diff = targetDate.getTime() - todayDate.getTime();
    setWeekOffset(Math.round(diff / msPerWeek));
    setJournalViewMode('daily');
  };

  const targetYear = new Date().getFullYear() - archiveYearOffset;

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-slate-50 font-bold mb-1">اليوميات والعادات 📖</h1>
          <p className="text-slate-400 text-sm">دوّن أفكارك وأحداث يومك وتابع عاداتك الإيجابية.</p>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl border border-glass-border self-start sm:self-center">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeMainTab === 'journal' ? 'bg-accent-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveMainTab('journal')}
          >
            <BookOpen size={16} /> اليوميات
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeMainTab === 'habits' ? 'bg-accent-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveMainTab('habits')}
          >
            <Activity size={16} /> العادات
          </button>
        </div>
      </header>

      {activeMainTab === 'habits' ? (
        <HabitsTracker />
      ) : (
        <div className="flex flex-col gap-6 animate-slideDown">
          {/* Week Navigation or Archive Mode */}
          <JournalDateNavigator
            journalViewMode={journalViewMode}
            setJournalViewMode={setJournalViewMode}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            archiveYearOffset={archiveYearOffset}
            setArchiveYearOffset={setArchiveYearOffset}
            weekDays={weekDays}
            targetYear={targetYear}
            selectedDate={selectedDate}
            today={today}
            entryDates={entryDates}
            setSelectedDate={setSelectedDate}
            entries={entries}
            handleSelectMonthFromArchive={handleSelectMonthFromArchive}
          />

          {/* Selected Day Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-slate-50 font-bold">{dateInfo.dayName}</h2>
              <p className="text-slate-400 text-sm">{dateInfo.dayNum} {dateInfo.month} {dateInfo.year}</p>
            </div>
            {!selectedEntry && formMode === 'none' && (
              <button className="btn-primary flex items-center gap-2 shadow-md shadow-accent-primary/20" onClick={handleAdd}>
                <Plus size={18} /> كتابة يومية
              </button>
            )}
            {selectedEntry && formMode === 'none' && (
              <div className="flex gap-2">
                <button className="btn-primary flex items-center gap-2 text-sm" onClick={handleEdit}>
                  <Edit2 size={16} /> تعديل
                </button>
                <button
                  className="btn-secondary flex items-center gap-2 text-sm text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10"
                  onClick={() => handleDelete(selectedEntry.id)}
                >
                  <Trash2 size={16} /> حذف
                </button>
              </div>
            )}
          </div>

          {/* Entry Form */}
          {formMode !== 'none' && (
            <JournalForm
              formMode={formMode}
              currentEntry={currentEntry}
              setCurrentEntry={setCurrentEntry}
              handleSave={handleSave}
              setFormMode={setFormMode}
              dateInfo={dateInfo}
            />
          )}

          {/* Entry Display */}
          <JournalEntryViewer
            loading={loading}
            selectedEntry={selectedEntry}
            formMode={formMode}
            dateInfo={dateInfo}
            handleAdd={handleAdd}
          />

          {/* Recent Entries Timeline */}
          {formMode === 'none' && (
            <RecentEntriesList
              entries={entries}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setFormMode('none');
              }}
              isSelectionMode={isSelectionMode}
              setIsSelectionMode={setIsSelectionMode}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              onBulkDelete={handleBulkDelete}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Journal;