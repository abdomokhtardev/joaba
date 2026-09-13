/**
 * Shared habit color configurations.
 * Single source of truth for Tailwind CSS class names and raw CSS values.
 * Used across HabitsTracker, HabitItem and HabitDetails.
 */

export const HABIT_COLORS = [
  { id: 'indigo', hex: 'bg-indigo-500', glow: 'shadow-indigo-500/50', rgb: '99, 102, 241', colorHex: '#6366f1' },
  { id: 'emerald', hex: 'bg-emerald-500', glow: 'shadow-emerald-500/50', rgb: '16, 185, 129', colorHex: '#10b981' },
  { id: 'rose', hex: 'bg-rose-500', glow: 'shadow-rose-500/50', rgb: '244, 63, 94', colorHex: '#f43f5e' },
  { id: 'amber', hex: 'bg-amber-500', glow: 'shadow-amber-500/50', rgb: '245, 158, 11', colorHex: '#f59e0b' },
  { id: 'cyan', hex: 'bg-cyan-500', glow: 'shadow-cyan-500/50', rgb: '6, 182, 212', colorHex: '#06b6d4' },
  { id: 'purple', hex: 'bg-purple-500', glow: 'shadow-purple-500/50', rgb: '168, 85, 247', colorHex: '#a855f7' },
];

/** Lookup map: color id -> { rgb, colorHex } for inline glow styles */
export const HABIT_COLOR_CONFIGS = {
  indigo: { rgb: '99, 102, 241', colorHex: '#6366f1' },
  emerald: { rgb: '16, 185, 129', colorHex: '#10b981' },
  rose: { rgb: '244, 63, 94', colorHex: '#f43f5e' },
  amber: { rgb: '245, 158, 11', colorHex: '#f59e0b' },
  cyan: { rgb: '6, 182, 212', colorHex: '#06b6d4' },
  purple: { rgb: '168, 85, 247', colorHex: '#a855f7' },
};

/**
 * Resolves the glow color config for a habit.
 * @param {string} habitColor - habit.color id
 * @param {object} colorObj - colorObj passed from parent (may have rgb/colorHex)
 * @returns {{ rgb: string, colorHex: string }}
 */
export const resolveHabitColorConfig = (habitColor, colorObj) =>
  (habitColor && HABIT_COLOR_CONFIGS[habitColor]) ||
  (colorObj?.id && HABIT_COLOR_CONFIGS[colorObj.id]) || {
    rgb: colorObj?.rgb || '99, 102, 241',
    colorHex: colorObj?.colorHex || '#6366f1',
  };
