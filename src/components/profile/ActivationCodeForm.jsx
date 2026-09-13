import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

const ActivationCodeForm = ({ onActivate, loading }) => {
  const [activationCode, setActivationCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activationCode.trim()) return;
    onActivate(activationCode.trim().toUpperCase(), () => setActivationCode(''));
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary shrink-0">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 className="text-lg text-slate-50 font-medium">تفعيل فوري باستخدام كود</h2>
            <p className="text-xs text-slate-400">إذا كان لديك كود تفعيل مباشر، أدخله هنا لتفعيل حسابك فوراً.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto min-w-[280px]">
          <input
            type="text"
            className="input-glass flex-1 uppercase tracking-wider text-center text-sm"
            placeholder="أدخل كود التفعيل"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
            required
          />
          <button type="submit" className="btn-secondary px-5 py-2 text-sm whitespace-nowrap" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تفعيل'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivationCodeForm;
