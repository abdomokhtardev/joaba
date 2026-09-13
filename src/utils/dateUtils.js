export const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export function getLocalDateString(date = new Date()) {
  if (!(date instanceof Date)) date = new Date(date);
  if (isNaN(date.getTime())) return '---';
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
}

export function formatArabicDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { dayName: '', dayNum: '', month: '', year: '', full: '' };
  const dayName = ARABIC_DAYS[d.getDay()];
  const dayNum = d.getDate();
  const month = ARABIC_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return { dayName, dayNum, month, year, full: `${dayName}، ${dayNum} ${month} ${year}` };
}

/**
 * Formats a fractional hour (e.g. 0.5, 1.25, 2) into friendly Arabic text.
 */
export function formatDuration(hours) {
  const num = Number(hours);
  if (!num || isNaN(num) || num <= 0) return '0 دقيقة';
  if (num < 1) {
    const minutes = Math.round(num * 60);
    return `${minutes} دقيقة`;
  }
  const wholeHours = Math.floor(num);
  const remainingMins = Math.round((num - wholeHours) * 60);
  if (remainingMins === 0) {
    if (wholeHours === 1) return 'ساعة';
    if (wholeHours === 2) return 'ساعتان';
    if (wholeHours >= 3 && wholeHours <= 10) return `${wholeHours} ساعات`;
    return `${wholeHours} ساعة`;
  }
  return `${wholeHours} س و ${remainingMins} د`;
}
