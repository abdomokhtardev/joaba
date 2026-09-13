import React, { useState } from 'react';
import { Trash2, CheckCircle2, XCircle, DollarSign, CheckSquare, Square } from 'lucide-react';
import { showDeleteConfirm } from '../../utils/toastUtils';

const HistoryTab = ({ historyRequests = [], onDeleteRequest, onBulkDeleteRequests }) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'approved' | 'rejected'
  const [selectedIds, setSelectedIds] = useState([]);

  const approvedRequests = historyRequests.filter((r) => r.status === 'approved');
  const rejectedRequests = historyRequests.filter((r) => r.status === 'rejected');

  const filteredRequests = historyRequests.filter((r) => {
    if (filter === 'approved') return r.status === 'approved';
    if (filter === 'rejected') return r.status === 'rejected';
    return true;
  });

  // Calculate net profit ONLY from approved requests using finalPrice (or planPrice fallback)
  const totalNetProfit = approvedRequests.reduce((acc, req) => {
    const paid = req.finalPrice !== undefined ? req.finalPrice : (req.planPrice || 0);
    const comm = paid === 0 ? 0 : (req.planCommission || 0);
    return acc + Math.max(0, paid - comm);
  }, 0);

  // Selection handlers
  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((req) => selectedIds.includes(req.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Unselect only the currently filtered ones
      const filteredIds = new Set(filteredRequests.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Add all currently filtered ones
      const newSelected = new Set([...selectedIds, ...filteredRequests.map((r) => r.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    showDeleteConfirm(
      `هل أنت متأكد من حذف (${selectedIds.length}) معاملة محددة نهائياً؟`,
      () => {
        if (onBulkDeleteRequests) {
          onBulkDeleteRequests(selectedIds);
        }
        setSelectedIds([]);
      }
    );
  };

  const handleDeleteSingle = (id, email) => {
    showDeleteConfirm(
      `حذف سجل معاملة (${email}) نهائياً؟`,
      () => {
        if (onDeleteRequest) onDeleteRequest(id);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="text-xl text-slate-50 font-bold">سجل المعاملات ({historyRequests.length})</h2>
          <p className="text-xs text-slate-400 mt-1">
            أرشيف العمليات السابقة (المقبولة والمرفوضة). يتم حذف صور الإيصالات تلقائياً لتوفير المساحة.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-lg transition-all font-medium ${
              filter === 'all' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الكل ({historyRequests.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 text-xs rounded-lg transition-all font-medium ${
              filter === 'approved' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            المقبولة ({approvedRequests.length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1 text-xs rounded-lg transition-all font-medium ${
              filter === 'rejected' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-400 hover:text-red-300'
            }`}
          >
            المرفوضة ({rejectedRequests.length})
          </button>
        </div>
      </div>

      {/* Net Profit Banner (Approved only) */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-xs text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
            <DollarSign size={14} /> إجمالي الأرباح الصافية (من الطلبات المقبولة فقط)
          </h3>
          <p className="text-2xl text-emerald-300 font-mono font-bold">
            {totalNetProfit.toLocaleString()} <span className="text-sm font-sans font-normal">ج.م</span>
          </p>
        </div>
        <div className="text-left text-xs text-slate-400">
          <div>مقبولة: <span className="text-emerald-400 font-bold">{approvedRequests.length}</span></div>
          <div>مرفوضة: <span className="text-red-400 font-bold">{rejectedRequests.length}</span></div>
        </div>
      </div>

      {/* Select All & Bulk Actions Bar */}
      {filteredRequests.length > 0 && (
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 px-4 py-2.5 rounded-xl">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors select-none font-medium"
          >
            {isAllFilteredSelected ? (
              <CheckSquare size={16} className="text-accent-primary" />
            ) : (
              <Square size={16} className="text-slate-500" />
            )}
            <span>تحديد الكل ({filteredRequests.length})</span>
          </button>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 animate-fadeIn">
              <span className="text-xs text-accent-primary font-bold">
                تم تحديد ({selectedIds.length})
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-bold transition-all"
              >
                <Trash2 size={13} />
                <span>حذف المحدد</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <p className="text-slate-400 text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
          لا توجد معاملات في هذا القسم.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRequests.map((req) => {
            const isApproved = req.status === 'approved';
            const paidAmount = req.finalPrice !== undefined ? req.finalPrice : (req.planPrice || 0);
            const netProfit = Math.max(0, paidAmount - (paidAmount === 0 ? 0 : (req.planCommission || 0)));
            const isSelected = selectedIds.includes(req.id);

            return (
              <div
                key={req.id}
                className={`border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isSelected
                    ? 'bg-accent-primary/10 border-accent-primary/40 shadow-[0_0_12px_rgba(var(--color-accent-primary),0.1)]'
                    : isApproved
                    ? 'bg-white/5 border-glass-border hover:border-emerald-500/30'
                    : 'bg-red-500/[0.03] border-red-500/20 hover:border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Item Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectOne(req.id)}
                    className="mt-1 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                    title={isSelected ? 'إلغاء التحديد' : 'تحديد'}
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="text-accent-primary" />
                    ) : (
                      <Square size={18} className="text-slate-500 hover:text-slate-300" />
                    )}
                  </button>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-50 font-medium">{req.email}</span>
                      {isApproved ? (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                          <CheckCircle2 size={12} /> مقبول
                        </span>
                      ) : (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                          <XCircle size={12} /> مرفوض
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>المحول منه: <strong className="text-slate-300 font-mono">{req.phoneTransfer || req.phoneNumber || '—'}</strong></span>
                      {req.planName && (
                        <span>
                          الباقة: <strong className="text-accent-primary">{req.planName}</strong> ({paidAmount} ج.م)
                          {req.finalPrice !== undefined && req.planPrice !== req.finalPrice && (
                            <span className="text-[10px] text-amber-400 mr-1 bg-amber-500/10 px-1.5 py-0.5 rounded">خصم</span>
                          )}
                        </span>
                      )}
                      {req.planDurationDays && (
                        <span>المدة: <strong className="text-slate-300">{req.planDurationDays} يوم</strong></span>
                      )}
                      {isApproved ? (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                          الصافي: <strong>{netProfit} ج.م</strong>
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                          لم يتم التفعيل أو احتساب أرباح
                        </span>
                      )}
                    </div>

                    {/* Show rejection note if rejected */}
                    {!isApproved && req.rejectionNote && (
                      <div className="text-xs text-red-300 bg-red-500/10 p-2 rounded-lg border border-red-500/20 mt-1">
                        <span className="font-bold">سبب الرفض:</span> {req.rejectionNote}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors self-end sm:self-center"
                  onClick={() => handleDeleteSingle(req.id, req.email)}
                  title="حذف هذا السجل نهائياً"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
