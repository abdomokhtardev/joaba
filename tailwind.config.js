/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0F172A',
        'accent-primary': '#6366F1',
        'accent-hover': '#4F46E5',
        'priority-red': '#EF4444',
        'priority-amber': '#F59E0B',
        'priority-blue': '#0EA5E9',
        'priority-gray': '#64748B',
        'glass-bg': 'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.3s ease',
      },
    },
  },
  plugins: [],
}
