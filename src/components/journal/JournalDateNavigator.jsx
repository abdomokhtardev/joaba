import React from 'react';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { formatArabicDate } from '../../utils/dateUtils';
import DayCard from './DayCard';
import ArchiveView from './ArchiveView';

const JournalDateNavigator = ({
  journalViewMode,
  setJournalViewMode,
  weekOffset,
  setWeekOffset,
  archiveYearOffset,
  setArchiveYearOffset,
  weekDays,
  targetYear,
  selectedDate,
  today,
  entryDates,
  setSelectedDate,
  entries,
  handleSelectMonthFromArchive
}) => {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => (journalViewMode === 'daily' ? setWeekOffset((w) => w + 1) : setArchiveYearOffset((y) => y - 1))}
          className="text-slate-400 hover:text-slate-50 hover:bg-white/10 p-2 rounded-xl transition-all"
          title="السابق"
        >
          <ChevronRight size={20} />
        </button>

        <div className="text-center">
          {journalViewMode === 'daily' ? (
            <>
              <p className="text-sm text-slate-400">
                {formatArabicDate(weekDays[0]).dayNum} {formatArabicDate(weekDays[0]).month} — {formatArabicDate(weekDays[6]).dayNum} {formatArabicDate(weekDays[6]).month}
              </p>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} className="text-xs text-accent-primary hover:underline mt-1">
                  العودة لهذا الأسبوع
                </button>
              )}
            </>
          ) : (
            <p className="text-lg text-slate-50 font-medium">{targetYear}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setJournalViewMode((m) => (m === 'daily' ? 'archive' : 'daily'))}
            className={`p-2 rounded-xl transition-all ${
              journalViewMode === 'archive' ? 'bg-accent-primary text-white' : 'text-slate-400 hover:bg-white/10 hover:text-slate-50'
            }`}
            title="الأرشيف السنوي"
          >
            <Calendar size={18} />
          </button>
          <button
            onClick={() => (journalViewMode === 'daily' ? setWeekOffset((w) => w - 1) : setArchiveYearOffset((y) => y + 1))}
            className="text-slate-400 hover:text-slate-50 hover:bg-white/10 p-2 rounded-xl transition-all"
            title="التالي"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {journalViewMode === 'daily' ? (
        <div className="overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          <div className="flex gap-2 min-w-max sm:min-w-0 sm:justify-between">
            {weekDays.map((day) => (
              <DayCard
                key={day}
                dateStr={day}
                isSelected={day === selectedDate}
                isToday={day === today}
                hasEntry={entryDates.has(day)}
                onClick={() => setSelectedDate(day)}
              />
            ))}
          </div>
        </div>
      ) : (
        <ArchiveView
          targetYear={targetYear}
          entries={entries}
          onSelectMonth={handleSelectMonthFromArchive}
        />
      )}
    </div>
  );
};

export default JournalDateNavigator;
