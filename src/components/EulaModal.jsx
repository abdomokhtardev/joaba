import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EulaModal = ({ readOnly = false, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAgree = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        eulaAccepted: true
      });
      toast.success('شكرًا لموافقتك! تم تفعيل حسابك.');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الموافقة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-glass-border bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">اتفاقية الاستخدام وسياسة الخصوصية</h2>
              <p className="text-sm text-slate-400">يرجى قراءة البنود التالية بعناية</p>
            </div>
          </div>
          {readOnly && (
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 text-slate-300 leading-relaxed">
          
          {!readOnly && (
            <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-xl text-accent-primary font-medium flex items-start gap-3">
              <ShieldCheck className="shrink-0 mt-0.5" size={20} />
              <p>يرجى قراءة البنود التالية والموافقة عليها للاستمرار في استخدام كافة ميزات التطبيق بأمان:</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
              سياسة الخصوصية وحماية البيانات
            </h3>
            <p className="text-slate-400 text-sm">
              جميع بياناتك الشخصية ويومياتك مشفرة ومحفوظة بأمان تام. نحن لا نقوم ببيع أو مشاركة بياناتك مع أي طرف ثالث تحت أي ظرف.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
              سياسة الدفع والاشتراكات
            </h3>
            <p className="text-slate-400 text-sm">
              الاشتراكات المدفوعة (عبر التحويل اليدوي) غير قابلة للاسترداد بعد تفعيل الحساب. تفعيل الحساب يتم يدوياً خلال ساعات العمل بعد مراجعة التحويل لضمان حقك.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
              قواعد السلوك والدعم الفني
            </h3>
            <p className="text-slate-400 text-sm">
              يُمنع استخدام تذاكر الدعم الفني أو الرسائل للإساءة أو إرسال كلمات نابية. نحتفظ بحق حظر أو تعليق أي حساب يخالف قواعد الاحترام المتبادل.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
              توفر الخدمة (إخلاء المسؤولية)
            </h3>
            <p className="text-slate-400 text-sm">
              نعمل جاهدين على إبقاء الخدمة متاحة بنسبة 99%، ولكننا نخلي مسؤوليتنا عن التوقفات المؤقتة الناتجة عن تحديثات الخوادم أو أسباب تقنية خارجة عن إرادتنا.
            </p>
          </div>
        </div>

        {/* Footer */}
        {!readOnly && (
          <div className="p-6 border-t border-glass-border bg-slate-900 flex justify-end">
            <button
              onClick={handleAgree}
              disabled={loading}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 text-base shadow-lg shadow-accent-primary/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  أوافق على جميع الشروط
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EulaModal;
