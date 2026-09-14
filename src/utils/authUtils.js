import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { initUserDocument } from './userUtils';
import toast from 'react-hot-toast';

/**
 * Executes Google authentication flow (redirect for mobile, popup for desktop).
 * Handles user doc initialization and navigation.
 *
 * @param {Object} options
 * @param {Function} options.navigate - React Router navigate function
 * @param {string} [options.successMessage='تم تسجيل الدخول بجوجل بنجاح! 🎉']
 */
export const executeGoogleAuth = async ({ navigate, successMessage = 'تم تسجيل الدخول بجوجل بنجاح! 🎉' }) => {
  try {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    const userCredential = await signInWithPopup(auth, googleProvider);
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref') || '';
    await initUserDocument(userCredential.user, refCode);
    toast.success(successMessage);
    navigate('/');
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      toast.error('فشل تسجيل الدخول بحساب جوجل.');
    }
  }
};

/**
 * Hook or handler for resolving redirect results from mobile Google auth.
 *
 * @param {Object} options
 * @param {Function} options.navigate - React Router navigate function
 * @param {string} [options.successMessage='تم تسجيل الدخول بجوجل بنجاح! 🎉']
 */
export const handleGoogleRedirectResult = async ({ navigate, successMessage = 'تم تسجيل الدخول بجوجل بنجاح! 🎉' }) => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || '';
      await initUserDocument(result.user, refCode);
      toast.success(successMessage);
      navigate('/');
    }
  } catch (err) {
    if (err.code && err.code !== 'auth/popup-closed-by-user') {
      toast.error('فشل تسجيل الدخول بحساب جوجل.');
    }
  }
};
