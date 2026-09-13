import React, { useState } from 'react';
import { Activity, CheckCircle, AlertCircle, Copy, Phone, Upload, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';
import { calculateFinalPrice } from '../../utils/priceUtils';
import { db } from '../../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { handleFirestoreError } from '../../utils/firestoreErrorUtils';

// ─── Plan Themes ──────────────────────────────────────────────────────────────
const PLAN_THEMES = [
  {
    gradient: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/5',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-500/10',
    text: 'text-blue-400',
    shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]'
  },
  {
    gradient: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/5',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]'
  },
  {
    gradient: 'bg-gradient-to-br from-orange-500/20 to-amber-500/5',
    activeBorder: 'border-orange-500',
    activeBg: 'bg-orange-500/10',
    text: 'text-orange-400',
    shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]'
  }
];

// ─── Shared: Payment Method Row ───────────────────────────────────────────────
// Eliminates the 3x duplicated Vodafone/InstaPay/PayPal button pattern
const PaymentMethodRow = ({ label, value, colorClass, bgClass, borderClass, dotClass, copyLabel }) => {
  const isLink = value.startsWith('http');
  return (
    <div className={`p-2.5 ${bgClass} ${borderClass} rounded-xl flex items-center justify-between gap-2`}>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${dotClass} animate-pulse`} />
        <span className={`text-xs ${colorClass} font-medium`}>{label}:</span>
      </div>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className={`text-xs ${bgClass.replace('/10', '/60')} hover:opacity-80 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium shadow-sm`}
        >
          فتح <ExternalLink size={11} />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(value); toast.success(`تم نسخ ${copyLabel}!`); }}
          className={`text-xs ${bgClass.replace('/10', '/60')} hover:opacity-80 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium font-mono`}
        >
          <Copy size={12} /> {value}
        </button>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const RenewalSection = ({
  currentUser,
  plans,
  userRequest,
  requestLoading,
  vodafoneNumber = '01029060019',
  instapayLink = '',
  paypalLink = '',
  onSubmitPaymentRequest,
  onDismissRequest
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [receiptImageBase64, setReceiptImageBase64] = useState('');
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [appliedPromoCodeId, setAppliedPromoCodeId] = useState(null);
  const [appliedTargetPlan, setAppliedTargetPlan] = useState(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Helper: get effective discount for the currently selected plan
  const getEffectiveDiscount = (planId) =>
    (!appliedTargetPlan || appliedTargetPlan === planId) ? appliedDiscount : null;

  const isFreePlan =
    selectedPlan &&
    calculateFinalPrice(selectedPlan.price, getEffectiveDiscount(selectedPlan.id)) === 0;

  // Reset all discount state at once
  const clearDiscount = () => {
    setAppliedDiscount(null);
    setAppliedPromoCodeId(null);
    setAppliedTargetPlan(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('حجم الصورة كبير جداً. أقصى حجم هو 5 ميجابايت.');
    }
    try {
      const dataUrl = await compressImage(file);
      setReceiptImageBase64(dataUrl);
    } catch {
      toast.error('حدث خطأ أثناء معالجة الصورة.');
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) {
      return toast.error('يرجى كتابة كود الخصم أولاً.');
    }
    try {
      // Limit to 1 as strictly required by Firestore security rules
      const q = query(
        collection(db, 'promo_codes'),
        where('code', '==', discountCodeInput.trim().toUpperCase()),
        where('isActive', '==', true),
        limit(1)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        clearDiscount();
        return toast.error('كود الخصم غير صحيح أو غير مفعّل.');
      }

      const codeDoc = snap.docs[0];
      const data = codeDoc.data();

      // Check exhaustion (supports maxUsage & legacy maxUses, currentUsage & legacy usedCount)
      const maxLimit = data.maxUsage !== undefined ? data.maxUsage : data.maxUses;
      const currentCount = data.currentUsage !== undefined ? data.currentUsage : (data.usedCount || 0);
      if (maxLimit && currentCount >= maxLimit) {
        clearDiscount();
        return toast.error('تم استنفاد الحد الأقصى لاستخدام هذا الكود.');
      }

      // Check already used by this user (by UID or email)
      if (data.usedBy && (data.usedBy.includes(currentUser.uid) || data.usedBy.includes(currentUser.email))) {
        clearDiscount();
        return toast.error('لقد قمت باستخدام كود الخصم هذا من قبل!');
      }

      // Apply plan-specific or global discount
      if (data.targetPlan && data.targetPlan !== 'all') {
        const targetPlanObj = plans.find(p => p.id === data.targetPlan);
        const planName = targetPlanObj ? targetPlanObj.name : data.targetPlan;
        setSelectedPlanId(data.targetPlan);
        setAppliedDiscount(data.discountPercent);
        setAppliedPromoCodeId(codeDoc.id);
        setAppliedTargetPlan(data.targetPlan);
        return toast.success(`تم تطبيق خصم ${data.discountPercent}% بنجاح! هذا الكود مخصص لـ: (${planName}) 🎉`);
      }

      setAppliedDiscount(data.discountPercent);
      setAppliedPromoCodeId(codeDoc.id);
      setAppliedTargetPlan(null);
      toast.success(`تم تطبيق خصم ${data.discountPercent}% على جميع الخطط بنجاح! 🎉`);
    } catch (err) {
      handleFirestoreError(err, 'حدث خطأ أثناء فحص كود الخصم.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlan) return toast.error('يرجى اختيار خطة الاشتراك أولاً.');
    if (!isFreePlan && !phoneNumber.trim()) {
      return toast.error('يرجى كتابة رقم الموبايل أو الحساب المحول منه.');
    }

    onSubmitPaymentRequest({
      phoneNumber: isFreePlan ? 'FREE_ACTIVATION' : phoneNumber,
      receiptImage: isFreePlan ? null : receiptImageBase64,
      selectedPlan,
      appliedDiscount: getEffectiveDiscount(selectedPlan.id),
      appliedPromoCodeId,
      onSuccess: () => {
        setSelectedPlanId(null);
        setPhoneNumber('');
        setReceiptImageBase64('');
        setDiscountCodeInput('');
        clearDiscount();
      }
    });
  };

  // ─── Status Banner Component ─────────────────────────────────────────────────
  const StatusBanner = () => {
    if (!userRequest || userRequest.status === 'archived') return null;

    const configs = {
      pending: {
        border: 'border-amber-500',
        bg: 'bg-amber-500/[0.03]',
        iconColor: 'text-amber-400',
        Icon: Activity,
        iconClass: 'animate-pulse',
        title: 'طلب الاشتراك الخاص بك قيد المراجعة',
        body: `لقد قمت بإرسال طلب اشتراك (${userRequest.planName || 'الخطة المختارة'}) برقم تحويل (${userRequest.phoneNumber || userRequest.phoneTransfer || ''}). سيتم مراجعته وتفعيل حسابك قريباً.`,
        btnClass: 'text-xs text-slate-400 hover:text-slate-200 border border-white/10 px-3 py-1.5 rounded-lg self-start md:self-auto transition-colors shrink-0',
        btnLabel: 'إخفاء التنبيه'
      },
      approved: {
        border: 'border-emerald-500',
        bg: 'bg-emerald-500/[0.05]',
        iconColor: 'text-emerald-400',
        Icon: CheckCircle,
        title: 'تم قبول طلبك وتفعيل اشتراكك بنجاح! 🎉',
        body: `تمت الموافقة على طلب اشتراكك لخطة (${userRequest.planName || 'الاشتراك'}). تم تمديد حسابك وتفعيله بنجاح.`,
        btnClass: 'text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-1.5 rounded-lg self-start md:self-auto transition-colors shrink-0 shadow-sm',
        btnLabel: 'رائع! إخفاء التنبيه'
      },
      rejected: {
        border: 'border-red-500',
        bg: 'bg-red-500/[0.05]',
        iconColor: 'text-red-400',
        Icon: AlertCircle,
        title: 'تم رفض طلب الاشتراك السابق',
        body: `للأسف، لم يتم قبول طلب الاشتراك السابق لخطة (${userRequest.planName || 'الاشتراك'}). يمكنك إرسال طلب جديد مع تصحيح البيانات.`,
        btnClass: 'text-xs text-slate-400 hover:text-red-300 border border-white/10 px-3 py-1.5 rounded-lg self-start md:self-auto transition-colors shrink-0',
        btnLabel: 'إخفاء التنبيه'
      }
    };

    const cfg = configs[userRequest.status];
    if (!cfg) return null;

    return (
      <div className={`glass-panel p-5 border-l-4 ${cfg.border} flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slideDown ${cfg.bg}`}>
        <div>
          <div className={`flex items-center gap-2 ${cfg.iconColor} font-bold mb-1`}>
            <cfg.Icon size={18} className={cfg.iconClass} />
            <span>{cfg.title}</span>
          </div>
          <p className="text-xs text-slate-300">{cfg.body}</p>
          {userRequest.status === 'rejected' && userRequest.rejectionNote && (
            <div className="mt-2 text-xs text-red-300 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 flex items-start gap-2">
              <span className="font-bold shrink-0">سبب الرفض:</span>
              <span>{userRequest.rejectionNote}</span>
            </div>
          )}
        </div>
        <button onClick={onDismissRequest} className={cfg.btnClass}>{cfg.btnLabel}</button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Plan Selection & Promo Code */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div>
            <h3 className="text-base text-slate-100 font-bold mb-1">١. اختر الخطة المناسبة لك</h3>
            <p className="text-xs text-slate-400">جميع الخطط تمنحك وصولاً كاملاً لجميع ميزات التطبيق.</p>
          </div>

          {/* Promo Code Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="لديك كود خصم؟ اكتبه هنا..."
              className="input-glass flex-1 text-sm font-mono uppercase"
              value={discountCodeInput}
              onChange={(e) => setDiscountCodeInput(e.target.value)}
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              className="bg-accent-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-primary/80 transition-colors"
            >
              تطبيق
            </button>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plans.map((plan, index) => {
              const theme = PLAN_THEMES[index % PLAN_THEMES.length];
              const isSelected = selectedPlanId === plan.id;
              const effectiveDiscount = getEffectiveDiscount(plan.id);
              const finalPrice = calculateFinalPrice(plan.price, effectiveDiscount);

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? `${theme.activeBg} ${theme.activeBorder} ${theme.shadow} scale-[1.02]`
                      : 'bg-white/[0.02] border-glass-border hover:border-white/20'
                  }`}
                >
                  <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${theme.gradient} blur-xl pointer-events-none opacity-50`} />

                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-bold ${theme.text}`}>{plan.name}</span>
                      {isSelected && <div className={`w-2 h-2 rounded-full ${theme.text} bg-current animate-ping`} />}
                    </div>

                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-2xl font-black text-slate-100">{finalPrice}</span>
                      <span className="text-xs text-slate-400">ج.م</span>
                      {effectiveDiscount && effectiveDiscount > 0 && (
                        <span className="text-xs text-slate-500 line-through mr-1 font-mono">{plan.price} ج.م</span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">صالحة لمدة {plan.durationDays} يوم</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 relative z-10 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">وصول غير محدود</span>
                    <span className={`text-xs font-bold ${isSelected ? theme.text : 'text-slate-500'}`}>
                      {isSelected ? '✓ محددة' : 'اختيار'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="p-3 bg-white/5 border border-glass-border rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-300">
                الخطة المختارة: <strong className="text-slate-100">{selectedPlan.name}</strong> ({selectedPlan.durationDays} يوم)
              </span>
              <span className="text-accent-primary font-bold font-mono text-sm">
                المطلوب تحويله: {calculateFinalPrice(selectedPlan.price, getEffectiveDiscount(selectedPlan.id))} ج.م
              </span>
            </div>
          )}
        </div>

        {/* Right: Payment Info & Form */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white/[0.02] p-5 rounded-2xl border border-glass-border">
          <div>
            <h3 className="text-sm text-slate-300 font-medium mb-3">٢. بيانات التحويل:</h3>

            {isFreePlan ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center justify-center gap-2 mb-4">
                <CheckCircle size={20} />
                <span>الكود المجاني يغطي قيمة الاشتراك بالكامل! انقر تأكيد لتفعيل حسابك مباشرة.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-3">
                {/* Vodafone Cash */}
                <PaymentMethodRow
                  label="فودافون كاش"
                  value={vodafoneNumber}
                  colorClass="text-red-300"
                  bgClass="bg-red-500/10"
                  borderClass="border border-red-500/20"
                  dotClass="bg-red-400"
                  copyLabel="الرقم"
                />

                {/* InstaPay */}
                {instapayLink && (
                  <PaymentMethodRow
                    label="إنستاباي"
                    value={instapayLink}
                    colorClass="text-purple-300"
                    bgClass="bg-purple-500/10"
                    borderClass="border border-purple-500/20"
                    dotClass="bg-purple-400"
                    copyLabel="معرف إنستاباي"
                  />
                )}

                {/* PayPal */}
                {paypalLink && (
                  <PaymentMethodRow
                    label="باي بال (PayPal)"
                    value={paypalLink}
                    colorClass="text-blue-300"
                    bgClass="bg-blue-500/10"
                    borderClass="border border-blue-500/20"
                    dotClass="bg-blue-400"
                    copyLabel="حساب باي بال"
                  />
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {!isFreePlan && (
                <>
                  <div className="relative">
                    <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      className="input-glass w-full !pl-3 !pr-10 text-sm"
                      placeholder="رقم المحفظة / عنوان إنستاباي المحول منه"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required={!isFreePlan}
                    />
                  </div>

                  <div className="relative">
                    <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-glass-border rounded-xl p-3 cursor-pointer hover:border-accent-primary/50 transition-colors bg-white/5">
                      <Upload size={20} className={receiptImageBase64 ? 'text-emerald-400' : 'text-slate-400'} />
                      <span className="text-xs font-medium text-slate-300">
                        {receiptImageBase64 ? 'تم إرفاق الإيصال بنجاح ✔️ (تغيير)' : 'إرفاق صورة إيصال التحويل (اختياري)'}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {receiptImageBase64 && (
                      <div className="mt-2 text-center bg-black/20 p-1.5 rounded-xl border border-glass-border">
                        <img src={receiptImageBase64} alt="Receipt" className="max-h-24 w-auto mx-auto rounded-lg" />
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-2.5 mt-1 text-sm"
                disabled={requestLoading || (userRequest && userRequest.status === 'pending')}
              >
                {requestLoading
                  ? 'جاري الإرسال...'
                  : isFreePlan
                    ? 'تأكيد الاشتراك المجاني 🚀'
                    : 'إرسال تأكيد التحويل'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalSection;
