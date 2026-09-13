import React, { useState } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const PromoCodesTab = ({ promoCodes = [], plans = [], onAddPromoCode, onDeletePromoCode, onTogglePromoCodeActive }) => {
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxUsage, setMaxUsage] = useState('');
  const [targetPlan, setTargetPlan] = useState('all');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!code.trim() || !discountPercent || !maxUsage) {
      return toast.error('يرجى ملء جميع الحقول');
    }
    const percent = Number(discountPercent);
    const usage = Number(maxUsage);
    
    if (percent <= 0 || percent > 100) return toast.error('نسبة الخصم يجب أن تكون بين 1 و 100');
    if (usage <= 0) return toast.error('الحد الأقصى للاستخدام يجب أن يكون أكبر من 0');

    onAddPromoCode(code.trim().toUpperCase(), percent, usage, targetPlan);
    setCode('');
    setDiscountPercent('');
    setMaxUsage('');
    setTargetPlan('all');
  };

  const copyCode = (c) => {
    navigator.clipboard.writeText(c);
    toast.success('تم نسخ كود الخصم!');
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Add Promo Code */}
      <div className="bg-white/5 border border-glass-border p-6 rounded-2xl relative overflow-hidden">
        <h2 className="text-xl text-slate-50 font-bold mb-4">إنشاء كود خصم جديد (Promo Code)</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm text-slate-400 mb-1">كود الخصم (مثال: WINTER50)</label>
            <input
              type="text"
              className="input-glass w-full uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="w-full sm:w-28">
            <label className="block text-sm text-slate-400 mb-1">نسبة الخصم %</label>
            <input
              type="number"
              min="1"
              max="100"
              className="input-glass w-full"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              required
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-sm text-slate-400 mb-1">الحد الأقصى</label>
            <input
              type="number"
              min="1"
              className="input-glass w-full"
              value={maxUsage}
              onChange={(e) => setMaxUsage(e.target.value)}
              required
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-sm text-slate-400 mb-1">الخطة المستهدفة</label>
            <select
              className="input-glass w-full"
              value={targetPlan}
              onChange={(e) => setTargetPlan(e.target.value)}
            >
              <option value="all">جميع الخطط</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary py-2.5 px-6 flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20 w-full sm:w-auto">
            <Plus size={18} /> إضافة
          </button>
        </form>
      </div>

      {/* 2. Existing Promo Codes */}
      <div className="border-t border-glass-border pt-6">
        <h2 className="text-xl text-slate-50 font-bold mb-4">أكواد الخصم الحالية ({promoCodes.length})</h2>
        {promoCodes.length === 0 ? (
          <p className="text-slate-500 text-sm glass-panel p-6 text-center">لا يوجد أكواد خصم مضافة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoCodes.map((p) => {
              const isExhausted = p.currentUsage >= p.maxUsage;
              const progress = Math.min((p.currentUsage / p.maxUsage) * 100, 100);

              return (
                <div key={p.id} className={`bg-white/5 border p-4 rounded-xl flex flex-col gap-3 transition-all ${p.isActive && !isExhausted ? 'border-accent-primary/50 shadow-sm shadow-accent-primary/10' : 'border-glass-border opacity-70'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xl text-slate-100 font-black tracking-wider select-all block">{p.code}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        مخصص لـ: {p.targetPlan && p.targetPlan !== 'all' ? plans.find(plan => plan.id === p.targetPlan)?.name || p.targetPlan : 'جميع الخطط'}
                      </span>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg text-sm font-bold shrink-0">خصم {p.discountPercent}%</span>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>الاستخدام</span>
                      <span>{p.currentUsage} / {p.maxUsage}</span>
                    </div>
                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isExhausted ? 'bg-red-500' : 'bg-accent-primary'}`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-glass-border/50">
                    <button
                      onClick={() => onTogglePromoCodeActive(p.id, p.isActive)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${p.isActive ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30'}`}
                    >
                      {p.isActive ? 'تعطيل الكود' : 'تفعيل الكود'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors" onClick={() => copyCode(p.code)} title="نسخ">
                        <Copy size={15} />
                      </button>
                      <button className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-red-400/10 transition-colors" onClick={() => onDeletePromoCode(p.id)} title="حذف">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCodesTab;
