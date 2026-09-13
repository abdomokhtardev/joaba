import React from 'react';
import { ARABIC_DAYS } from '../../utils/dateUtils';

const DayCard = ({ dateStr, isSelected, isToday, hasEntry, onClick }) => {
  const d = new Date(dateStr);
  const dayName = ARABIC_DAYS[d.getDay()];
  const dayNum = d.getDate();

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl transition-all duration-300 min-w-[55px] sm:min-w-[70px] flex-1 border shrink-0 ${
        isSelected
          ? 'bg-accent-primary text-white border-accent-primary shadow-lg shadow-accent-primary/30 scale-105'
          : isToday
            ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30 hover:bg-accent-primary/20'
            : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10 hover:text-slate-200'
      }`}
    >
      <span className="text-[10px] sm:text-[11px] font-medium">{dayName}</span>
      <span className={`text-lg sm:text-xl font-bold ${isSelected ? 'text-white' : ''}`}>{dayNum}</span>
      {hasEntry && (
        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-accent-primary'}`} />
      )}
    </button>
  );
};

export default DayCard;
