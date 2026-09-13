import React from 'react';
import toast from 'react-hot-toast';

/**
 * Displays a unified confirmation toast for deletion actions.
 * @param {string} message - The message to display (e.g., "هل أنت متأكد من الحذف؟")
 * @param {Function} onConfirm - The callback to execute when the user clicks 'حذف'
 * @param {string} successMessage - Optional success message to show after execution
 */
export const showDeleteConfirm = (message, onConfirm, successMessage = 'تم الحذف 🗑️') => {
  toast((t) => (
    <div className="flex items-center gap-3">
      <span>{message}</span>
      <button
        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
        onClick={async () => {
          try {
            await onConfirm();
            toast.dismiss(t.id);
            if (successMessage) toast.success(successMessage);
          } catch (error) {
            toast.dismiss(t.id);
            toast.error('حدث خطأ أثناء الحذف.');
            console.error(error);
          }
        }}
      >
        حذف
      </button>
      <button
        className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/20 transition-colors"
        onClick={() => toast.dismiss(t.id)}
      >
        إلغاء
      </button>
    </div>
  ), { duration: 6000 });
};
