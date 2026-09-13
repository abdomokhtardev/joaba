import toast from 'react-hot-toast';

/**
 * Handles Firestore errors with clear Arabic feedback.
 * Specifically detects permission-denied errors (e.g. account suspended, session expired, invalid payload length).
 * 
 * @param {Error|object} error - The caught error object
 * @param {string} defaultMessage - Fallback toast message
 */
export const handleFirestoreError = (error, defaultMessage = 'حدث خطأ أثناء تنفيذ العملية.') => {
  console.error('Firestore operation error:', error);

  if (error?.code === 'permission-denied') {
    toast.error('ليس لديك صلاحية لتنفيذ هذا الإجراء (قد يكون الحساب معلقاً أو انتهت الجلسة).');
    return;
  }

  if (error?.code === 'resource-exhausted') {
    toast.error('تم تجاوز الحد المسموح للطلبات، يرجى المحاولة بعد قليل.');
    return;
  }

  if (error?.code === 'unavailable') {
    toast.error('خدمة قاعدة البيانات غير متوفرة حالياً، يرجى التحقق من اتصال الإنترنت.');
    return;
  }

  toast.error(defaultMessage);
};
