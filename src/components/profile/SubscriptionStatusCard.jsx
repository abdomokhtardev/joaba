import React from 'react';
import { CalendarCheck, CalendarX, CheckCircle, AlertCircle } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

const SubscriptionStatusCard = ({ currentUser, userData, isSubscribed, endDate }) => {
  return (
    <div className={`glass-panel p-6 border-l-4 ${isSubscribed ? 'border-emerald-500' : 'border-red-500'} relative overflow-hidden`}>
      {/* Background Icon */}
      <div className="absolute left-[-20px] top-[-20px] opacity-[0.03] pointer-events-none">
        {isSubscribed ? <CalendarCheck size={200} /> : <CalendarX size={200} />}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h3 className="text-sm text-slate-400 font-medium mb-1">البريد الإلكتروني</h3>
          <p className="text-lg text-slate-50 mb-4">{currentUser?.email}</p>

          <h3 className="text-sm text-slate-400 font-medium mb-1">حالة الاشتراك</h3>
          <div className="flex items-center gap-2">
            {userData?.role === 'admin' ? (
              <span className="text-accent-primary font-bold bg-accent-primary/10 px-3 py-1 rounded-full text-sm">أدمين (وصول دائم)</span>
            ) : isSubscribed ? (
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <CheckCircle size={16} /> نشط
              </span>
            ) : (
              <span className="text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <AlertCircle size={16} /> منتهي
              </span>
            )}
          </div>
        </div>

        {userData?.role !== 'admin' && (
          <div className="bg-white/5 p-4 rounded-xl text-center min-w-[200px]">
            <h3 className="text-slate-400 text-sm mb-1">تاريخ الانتهاء</h3>
            <p className="text-2xl text-slate-50 font-bold">
              {endDate ? getLocalDateString(endDate) : '---'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatusCard;
