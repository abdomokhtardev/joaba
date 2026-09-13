import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { initUserDocument } from '../utils/userUtils';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error('كلمات المرور غير متطابقة.');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Parse ref code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || '';
      
      await initUserDocument(userCredential.user, refCode);

      toast.success('تم إنشاء حسابك بنجاح! 🎉');
      navigate('/');
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          toast.error('البريد الإلكتروني مسجل مسبقاً.');
          break;
        case 'auth/invalid-email':
          toast.error('صيغة البريد الإلكتروني غير صحيحة.');
          break;
        case 'auth/weak-password':
          toast.error('كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل.');
          break;
        default:
          toast.error('حدث خطأ أثناء إنشاء الحساب.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || '';
      
      await initUserDocument(userCredential.user, refCode);

      toast.success('تم التسجيل بحساب جوجل بنجاح! 🎉');
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('فشل التسجيل بجوجل.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 animate-slideDown">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent-primary/30 shadow-[0_0_15px] shadow-accent-primary/20">
            <Lock size={32} className="text-accent-primary" />
          </div>
          <h2 className="text-3xl text-slate-50 font-medium mb-2">إنشاء حساب جديد</h2>
          <p className="text-slate-400">انضم إلينا وابدأ في إدارة مهامك بكفاءة</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="email"
              className="input-glass w-full !pl-4 !pr-12 text-lg py-3"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-glass w-full !pl-12 !pr-12 text-lg py-3"
              placeholder="كلمة المرور (6 أحرف على الأقل)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="input-glass w-full !pl-12 !pr-12 text-lg py-3"
              placeholder="تأكيد كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 text-lg mt-2 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-glass-border" />
          <span className="text-slate-500 text-sm">أو</span>
          <div className="flex-1 h-px bg-glass-border" />
        </div>

        {/* Google Signup */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-glass-border text-slate-50 py-3.5 rounded-xl transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-lg"
          onClick={handleGoogleSignup}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          التسجيل بحساب جوجل
        </button>

        <div className="mt-6 text-center border-t border-glass-border pt-6">
          <p className="text-slate-400">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-accent-primary hover:underline font-medium inline-flex items-center gap-1">
              تسجيل الدخول <ArrowRight size={16} className="rotate-180" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
