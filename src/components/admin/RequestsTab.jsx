import React, { useState } from 'react';
import { CreditCard, Image as ImageIcon, Check, X } from 'lucide-react';

const RequestsTab = ({ pendingRequests, onApprove, onReject }) => {
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [approveDays, setApproveDays] = useState(30);
  const [viewingImageId, setViewingImageId] = useState(null);

  const handleApprove = (req) => {
    onApprove(req, approveDays);
    setApprovingId(null);
  };

  const handleReject = () => {
    if (!rejectingId || !rejectionNote) return;
    onReject(rejectingId, rejectionNote);
    setRejectingId(null);
    setRejectionNote('');
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl text-slate-50 mb-2">طلبات الدفع المعلقة ({pendingRequests.length})</h2>
      {pendingRequests.length === 0 ? (
        <p className="text-slate-400 text-center py-10">لا توجد طلبات جديدة.</p>
      ) : (
        pendingRequests.map((req) => {
          // finalPrice = actual amount paid (after discount), planPrice = original
          const originalPrice = req.planPrice || 0;
          const finalPrice = req.finalPrice !== undefined ? req.finalPrice : originalPrice;
          const hasDiscount = req.promoCodeId && finalPrice < originalPrice;

          return (
            <div key={req.id} className="bg-white/5 border border-glass-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-slate-50 font-medium mb-1">{req.email}</p>
                <p className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                  <CreditCard size={14} /> محول من: <span className="text-emerald-400 font-mono font-bold tracking-wider">{req.phoneTransfer}</span>
                </p>
                {req.planName && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-400 text-xs bg-white/5 inline-block px-2 py-1 rounded">
                      الباقة: <span className="text-accent-primary font-bold">{req.planName}</span>
                    </p>
                    {hasDiscount ? (
                      <>
                        <span className="text-xs text-slate-500 line-through font-mono">{originalPrice} ج.م</span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg font-bold">{finalPrice} ج.م ✓ خصم</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-300 font-mono">{finalPrice} ج.م</span>
                    )}
                  </div>
                )}
                {req.receiptImage && (
                  <div className="mt-3">
                    <button
                      className="text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-glass-border transition-colors"
                      onClick={() => setViewingImageId(viewingImageId === req.id ? null : req.id)}
                    >
                      <ImageIcon size={14} /> {viewingImageId === req.id ? 'إخفاء الإيصال' : 'عرض صورة الإيصال'}
                    </button>
                    {viewingImageId === req.id && (
                      <div className="mt-3 bg-black/20 p-2 rounded-xl border border-glass-border inline-block max-w-full">
                        <img src={req.receiptImage} alt="Receipt" className="max-w-full max-h-[400px] object-contain rounded-lg" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {rejectingId === req.id ? (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    className="input-glass flex-1 text-sm"
                    placeholder="سبب الرفض..."
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                  />
                  <button className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600" onClick={handleReject}><Check size={16} /></button>
                  <button className="bg-white/10 text-slate-300 p-2 rounded-lg hover:bg-white/20" onClick={() => { setRejectingId(null); setRejectionNote(''); }}><X size={16} /></button>
                </div>
              ) : approvingId === req.id ? (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="number"
                    min="1"
                    className="input-glass w-24 text-sm"
                    placeholder="الأيام"
                    value={approveDays}
                    onChange={(e) => setApproveDays(e.target.value)}
                  />
                  <button className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600" onClick={() => handleApprove(req)}><Check size={16} /></button>
                  <button className="bg-white/10 text-slate-300 p-2 rounded-lg hover:bg-white/20" onClick={() => setApprovingId(null)}><X size={16} /></button>
                </div>
              ) : (
                <div className="flex gap-2 shrink-0">
                  <button
                    className="btn-primary py-1.5 px-4 text-sm bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 border-transparent flex items-center gap-1"
                    onClick={() => { setApprovingId(req.id); setApproveDays(req.planDurationDays || 30); }}
                  >
                    <Check size={16} /> موافقة
                  </button>
                  <button
                    className="btn-secondary py-1.5 px-4 text-sm text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10 flex items-center gap-1"
                    onClick={() => setRejectingId(req.id)}
                  >
                    <X size={16} /> رفض
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default RequestsTab;
