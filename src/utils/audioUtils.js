/**
 * Web Audio API synthesized sound generator for lightweight micro-interactions.
 * No external sound files required (zero bandwidth / zero latency).
 */

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  
  if (!window._appAudioCtx) {
    window._appAudioCtx = new AudioContextClass();
  }
  if (window._appAudioCtx.state === 'suspended') {
    window._appAudioCtx.resume();
  }
  return window._appAudioCtx;
};

export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('app_sound_enabled');
  return saved === null ? true : saved === 'true';
};

export const setSoundEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('app_sound_enabled', String(enabled));
};

/**
 * Plays a pleasant ascending victory chime when a task is completed.
 */
export const playTaskCompleteSound = () => {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.08);
      osc.stop(ctx.currentTime + index * 0.08 + 0.36);
    });
  } catch (err) {
    // Graceful fallback if audio is blocked
  }
};

/**
 * Plays a subtle, satisfying soft click when checking a habit.
 */
export const playHabitClickSound = () => {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  } catch (err) {
    // Graceful fallback
  }
};

/**
 * Plays a calming bell chime when a Pomodoro timer finishes.
 */
export const playTimerChime = () => {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const chords = [587.33, 880.0, 1174.66]; // D5, A5, D6
    chords.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.25);
    });
  } catch (err) {
    // Graceful fallback
  }
};
