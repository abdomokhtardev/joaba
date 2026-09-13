import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../../utils/toastUtils';

const AffiliatesTab = ({ affiliates, onCreateAffiliate, onPayAffiliate, onDeleteAffiliate }) => {
  const [newAffiliateName, setNewAffiliateName] = useState('');
  const [newAffiliateCode, setNewAffiliateCode] = useState('');
  const [payAmounts, setPayAmounts] = useState({});

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newAffiliateName || !newAffiliateCode) return;
    onCreateAffiliate(newAffiliateName, newAffiliateCode);
    setNewAffiliateName('');
    setNewAffiliateCode('');
  };

  const handlePay = (id, pending) => {
    const amountToPay = payAmounts[id] !== undefined ? parseFloat(payAmounts[id]) : pending;
    if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > pending) {
      return toast.error('المبلغ المدخل غير صحيح أو يتجاوز الرصيد المعلق.');
    }
    onPayAffiliate(id, amountToPay);
    setPayAmounts((prev) => ({ ...prev, [id]: '' }));
  };

  const handleDeleteWithConfirm = (id) => {
    showDeleteConfirm('هل أنت متأكد من حذف هذا المسوق بشكل نهائي؟ هذا الإجراء لا يمكن التراجع عنه.', () => {
      onDeleteAffiliate(id);
    }, null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl text-slate-50 mb-4">إضافة مسوق جديد</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-slate-400 mb-1">الاسم</label>
            <input 
              type="text" 
              className="input-glass w-full" 
              value={newAffiliateName} 
              onChange={(e) => setNewAffiliateName(e.target.value)} 
              required 
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-slate-400 mb-1">كود الإحالة (مثال: OMAR20)</label>
            <input 
              type="text" 
              className="input-glass w-full uppercase" 
              value={newAffiliateCode} 
              onChange={(e) => setNewAffiliateCode(e.target.value.toUpperCase())} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary py-2.5 px-6 flex items-center gap-2">
            <Plus size={18} /> إضافة
          </button>
        </form>
      </div>

      <div className="border-t border-glass-border pt-6">
        <h2 className="text-xl text-slate-50 mb-4">المسوقين</h2>
        {affiliates.length === 0 ? (
          <p className="text-slate-500 text-sm">لا يوجد مسوقين مضافين حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {affiliates.map((aff) => (
              <div key={aff.id} className="bg-white/5 border border-glass-border p-5 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-50">{aff.name}</h3>
                  <span className="font-mono text-sm bg-accent-primary/20 text-accent-primary px-2 py-1 rounded-lg" dir="ltr">?ref={aff.code}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex-1 bg-black/20 p-3 rounded-lg min-w-[80px]">
                    <p className="text-xs text-slate-400 mb-1">رصيد معلق</p>
                    <p className="text-lg font-bold text-emerald-400">{aff.pendingCommission} ج.م</p>
                  </div>
                  <div className="flex-1 bg-black/20 p-3 rounded-lg min-w-[80px]">
                    <p className="text-xs text-slate-400 mb-1">إجمالي ما سحب</p>
                    <p className="text-lg font-bold text-slate-300">{aff.totalPaid} ج.م</p>
                  </div>
                  <div className="flex-1 bg-accent-primary/10 border border-accent-primary/20 p-3 rounded-lg min-w-[100px]">
                    <p className="text-xs text-accent-primary mb-1">أرباحي الصافية منه</p>
                    <p className="text-lg font-bold text-slate-50">{aff.totalGeneratedProfit || 0} ج.م</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={aff.pendingCommission}
                      className="input-glass flex-1 text-sm text-center"
                      placeholder="المبلغ المراد دفعه"
                      value={payAmounts[aff.id] !== undefined ? payAmounts[aff.id] : (aff.pendingCommission > 0 ? aff.pendingCommission : '')}
                      onChange={(e) => setPayAmounts((prev) => ({ ...prev, [aff.id]: e.target.value }))}
                      disabled={aff.pendingCommission === 0}
                    />
                    <button
                      className="py-2 px-6 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handlePay(aff.id, aff.pendingCommission)}
                      disabled={aff.pendingCommission === 0}
                    >
                      دفع
                    </button>
                  </div>

                  <button
                    className="w-full py-2 mt-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    onClick={() => handleDeleteWithConfirm(aff.id)}
                  >
                    <Trash2 size={16} /> حذف المسوق
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliatesTab;
