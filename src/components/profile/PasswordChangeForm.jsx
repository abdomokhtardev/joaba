import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const PasswordChangeForm = ({ isGoogleUser, onChangePassword, onResetPassword, loading }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    onChangePassword(currentPassword, newPassword, () => {
      setCurrentPassword('');
      setNewPassword('');
    });
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl text-slate-50 mb-4 flex items-center gap-2">
        <Lock size={20} className="text-accent-primary" />
        تغيير كلمة المرور
      </h2>

      {!isGoogleUser ? (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">كلمة المرور الحالية</label>
            <div className="relative flex items-center">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="input-glass w-full text-sm !pl-10 !pr-3 py-2"
                placeholder="أدخل كلمة المرور الحالية"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute left-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex={-1}
                title={showCurrentPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">كلمة المرور الجديدة</label>
            <div className="relative flex items-center">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="input-glass w-full text-sm !pl-10 !pr-3 py-2"
                placeholder="6 أحرف على الأقل"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute left-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
                title={showNewPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 mt-1 pt-3 border-t border-glass-border">
            <button
              type="button"
              onClick={onResetPassword}
              className="text-sm text-slate-400 hover:text-accent-primary hover:underline transition-colors"
            >
              نسيت كلمة المرور الحالية؟
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2 bg-slate-700 hover:bg-slate-600 shadow-none border border-glass-border text-sm w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? 'جاري التغيير...' : 'حفظ كلمة المرور'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center text-slate-400 py-4 flex items-center justify-center gap-2">
          <Lock size={18} className="opacity-50" />
          <p className="text-sm">أنت مسجل باستخدام حساب جوجل (لا يمكنك تغيير كلمة المرور من هنا).</p>
        </div>
      )}
    </div>
  );
};

export default PasswordChangeForm;
