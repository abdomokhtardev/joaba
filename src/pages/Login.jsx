import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { initUserDocument } from '../utils/userUtils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('تم تسجيل الدخول بنجاح! 🎉');
      navigate('/');
    } catch (err) {
      toast.error('فشل تسجيل الدخول. تأكد من صحة البريد الإلكتروني وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);

      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || '';

      await initUserDocument(userCredential.user, refCode);

      toast.success('تم تسجيل الدخول بجوجل بنجاح! 🎉');
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('فشل تسجيل الدخول بجوجل.');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email || !email.trim()) {
      toast.error('يرجى كتابة بريدك الإلكتروني في الحقل أعلاه أولاً.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success('تم إرسال الرابط! تفقد بريدك ومجلد الرسائل غير المرغوب فيها (Spam) ✉️', { duration: 6000 });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        toast.error('هذا البريد الإلكتروني غير مسجل لدينا.');
      } else if (err.code === 'auth/invalid-email') {
        toast.error('صيغة البريد الإلكتروني غير صحيحة.');
      } else {
        toast.error('فشل إرسال الرابط. تأكد من تفعيل الخدمة في فايربيز.');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="glass-panel w-full max-w-md p-10 animate-slideDown">
        <div className="text-center mb-8">
          <Lock size={48} className="text-accent-primary mx-auto mb-4" />
          <h2 className="text-3xl text-slate-50 mb-2">مرحباً بعودتك</h2>
          <p className="text-slate-400">سجل دخولك للوصول إلى مساحتك الإنتاجية</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative flex items-center">
            <Mail className="absolute right-4 text-slate-400" size={20} />
            <input
              type="email"
              className="input-glass w-full !pl-4 !pr-12 py-3.5"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute right-4 text-slate-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-glass w-full !pl-12 !pr-12 py-3.5"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute left-4 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="btn-primary mt-2 py-3.5 text-lg" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-glass-border" />
          <span className="text-slate-500 text-sm">أو</span>
          <div className="flex-1 h-px bg-glass-border" />
        </div>

        {/* Google Login */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-glass-border text-slate-50 py-3.5 rounded-xl transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-lg"
          onClick={handleGoogleLogin}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
          تسجيل الدخول بحساب جوجل
        </button>

        <div className="mt-6 text-center flex flex-col gap-4">
          <button type="button" className="text-sm text-slate-400 hover:text-accent-primary hover:underline bg-transparent border-none cursor-pointer" onClick={handleResetPassword}>
            هل نسيت كلمة المرور؟
          </button>

          <div className="border-t border-glass-border pt-4">
            <p className="text-slate-400 text-sm">
              ليس لديك حساب؟{' '}
              <Link to="/signup" className="text-accent-primary hover:underline font-medium inline-flex items-center gap-1">
                إنشاء حساب <ArrowRight size={14} className="rotate-180" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
