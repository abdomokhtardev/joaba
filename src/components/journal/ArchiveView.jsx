import React from 'react';
import { ARABIC_MONTHS, getLocalDateString } from '../../utils/dateUtils';

const ArchiveView = ({
  targetYear,
  entries = [],
  onSelectMonth
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4 animate-slideDown">
      {ARABIC_MONTHS.map((monthName, idx) => {
        const monthEntries = entries.filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === targetYear && d.getMonth() === idx;
        });

        return (
          <button
            key={monthName}
            onClick={() => onSelectMonth(targetYear, idx)}
            className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 hover:border-accent-primary/50 transition-all border-white/5 bg-white/5 group"
          >
            <span className="text-base font-bold text-slate-100 group-hover:text-accent-primary transition-colors">
              {monthName}
            </span>
            {monthEntries.length > 0 ? (
              <>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-accent-primary h-full transition-all duration-500"
                    style={{ width: `${Math.min((monthEntries.length / 31) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-accent-primary font-mono">{monthEntries.length} يومية</span>
              </>
            ) : (
              <span className="text-xs text-slate-500">لا يوجد</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ArchiveView;
