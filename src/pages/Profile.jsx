import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, onSnapshot, limit, writeBatch } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { ShieldCheck, MessageSquare, CheckCircle2, Smartphone, Download, Globe, ChevronDown, ExternalLink, FileText, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_PLANS } from '../utils/constants';
import { calculateFinalPrice } from '../utils/priceUtils';
import useUnreadTickets from '../hooks/useUnreadTickets';
import { handleFirestoreError } from '../utils/firestoreErrorUtils';
import { sanitizeUrl } from '../utils/securityUtils';

import SubscriptionStatusCard from '../components/profile/SubscriptionStatusCard';
import ActivationCodeForm from '../components/profile/ActivationCodeForm';
import RenewalSection from '../components/profile/RenewalSection';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';
import SupportModal from '../components/SupportModal';
import EulaModal from '../components/EulaModal';

const Profile = () => {
  const { currentUser, userData } = useAuth();

  // State
  const [userRequest, setUserRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [bannerSettings, setBannerSettings] = useState(null);
  const [vodafoneNumber, setVodafoneNumber] = useState('01029060019');
  const [instapayLink, setInstapayLink] = useState('');
  const [paypalLink, setPaypalLink] = useState('');
  const [appLinks, setAppLinks] = useState({ platformLink: '', directDownloadLink: '', developerLink: '' });
  const [activationLoading, setActivationLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isEulaOpen, setIsEulaOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('payment'); // 'payment' or 'vip'

  // Shared hook for unread ticket replies
  const { hasUnreadReplies } = useUnreadTickets(currentUser);

  // Computed Values
  const isSubscribed = userData?.role === 'admin' || (userData?.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date());
  const endDate = userData?.subscriptionEndDate ? new Date(userData.subscriptionEndDate) : null;
  const isGoogleUser = currentUser?.providerData[0]?.providerId === 'google.com';

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen to user's payment request (pending, approved, or rejected until dismissed)
    const unReq = onSnapshot(
      query(collection(db, 'payment_requests'), where('userId', '==', currentUser.uid)),
      (snapshot) => {
        if (!snapshot.empty) {
          const requests = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const isDismissedInDb = data.userDismissedStatus === data.status || (data.userDismissed === true && !data.userDismissedStatus);
            const isLocallyDismissed =
              localStorage.getItem(`dismissed_req_${currentUser.uid}_${docSnap.id}_${data.status}`) === 'true';

            if (!isDismissedInDb && !isLocallyDismissed && data.status !== 'archived') {
              requests.push({ id: docSnap.id, ...data });
            }
          });
          requests.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });
          setUserRequest(requests.length > 0 ? requests[0] : null);
        } else {
          setUserRequest(null);
        }
      }
    );

    // 2. Listen to plans, payment methods & banner settings
    const unSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.plans)) setPlans(data.plans);
        setBannerSettings(data.banner || null);
        if (data.vodafoneNumber) setVodafoneNumber(data.vodafoneNumber);
        if (data.instapayLink) setInstapayLink(data.instapayLink);
        if (data.paypalLink) setPaypalLink(data.paypalLink);
        setAppLinks({
          platformLink: data.platformLink || data.appDownloadLink || '',
          directDownloadLink: data.directDownloadLink || data.googlePlayLink || '',
          developerLink: data.developerLink || ''
        });
      }
    });

    return () => {
      unReq();
      unSettings();
    };
  }, [currentUser]);

  // -- Handlers --

  const handleDismissRequest = async () => {
    if (!userRequest) return;
    try {
      // Store in localStorage to hide immediately and across refreshes
      localStorage.setItem(`dismissed_req_${currentUser.uid}_${userRequest.id}_${userRequest.status}`, 'true');

      // Update Firestore status to 'archived' only if already reviewed (approved/rejected), allowed by rules
      if (userRequest.status === 'approved' || userRequest.status === 'rejected') {
        try {
          await updateDoc(doc(db, 'payment_requests', userRequest.id), {
            status: 'archived'
          });
        } catch (e) {
          // Non-blocking
        }
      }

      setUserRequest(null);
    } catch (error) {
      console.error('Error dismissing request:', error);
      setUserRequest(null);
    }
  };

  const handleSubmitPaymentRequest = async ({ phoneNumber, receiptImage, selectedPlan, appliedDiscount, appliedPromoCodeId, onSuccess }) => {
    setRequestLoading(true);
    try {
      const finalPrice = calculateFinalPrice(selectedPlan.price, appliedDiscount);

      const requestData = {
        userId: currentUser.uid,
        email: currentUser.email,
        phoneTransfer: phoneNumber,
        receiptImage,
        status: 'pending',
        rejectionNote: '',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planPrice: selectedPlan.price,  // original price
        finalPrice,                      // price after discount
        amount: finalPrice > 0 ? finalPrice : 1, // amount required by rules to be > 0
        planDurationDays: selectedPlan.durationDays,
        planCommission: selectedPlan.commission,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (appliedPromoCodeId) {
        requestData.promoCodeId = appliedPromoCodeId;
      }

      await addDoc(collection(db, 'payment_requests'), requestData);

      toast.success('تم إرسال طلب التحويل بنجاح! سيتم مراجعته وتفعيل الحساب قريباً.');
      if (onSuccess) onSuccess();
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء إرسال الطلب.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleActivateCode = async (codeStr, onSuccess) => {
    setActivationLoading(true);
    try {
      // Limit to 1 as strictly required by Firestore security rules
      const q = query(
        collection(db, 'activation_codes'),
        where('code', '==', codeStr),
        where('isValid', '==', true),
        limit(1)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error('كود التفعيل غير صحيح أو تم استخدامه من قبل.');
        setActivationLoading(false);
        return;
      }

      const codeDoc = snap.docs[0];
      const codeData = codeDoc.data();
      const durationDays = codeData.durationDays || 30;

      const currentEnd = (userData?.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date())
        ? new Date(userData.subscriptionEndDate)
        : new Date();

      currentEnd.setDate(currentEnd.getDate() + durationDays);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        subscriptionEndDate: currentEnd.toISOString(),
        hasSubscribedBefore: true
      });

      await updateDoc(doc(db, 'activation_codes', codeDoc.id), {
        isValid: false,
        usedBy: currentUser.email,
        usedByEmail: currentUser.email,
        usedAt: serverTimestamp()
      });

      toast.success(`تم تفعيل الكود بنجاح! تم تمديد اشتراكك لمدة ${durationDays} يوم 🎉`);
      if (onSuccess) onSuccess();
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء تفعيل الكود.');
    } finally {
      setActivationLoading(false);
    }
  };

  const handleChangePassword = async (currentPassword, newPassword, onSuccess) => {
    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      toast.success('تم تغيير كلمة المرور بنجاح!');
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('كلمة المرور الحالية غير صحيحة.');
      } else {
        toast.error('فشل تغيير كلمة المرور. تأكد من أن كلمة المرور الجديدة 6 أحرف على الأقل.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast.success('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني! تفقد مجلد الـ Spam ✉️');
    } catch (error) {
      toast.error('فشل إرسال الرابط.');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-slate-50 mb-1 flex items-center gap-3">
            <ShieldCheck className="text-accent-primary" size={32} />
            الملف الشخصي والاشتراك
          </h1>
          <p className="text-slate-400">إدارة حسابك، باقات الاشتراك، وتغيير كلمة المرور.</p>
        </div>

        {userData?.role !== 'admin' && (
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
            {/* 1. Support & Recommendations Button */}
            <button
              onClick={() => setIsSupportOpen(true)}
              className="btn-secondary flex items-center gap-2 text-xs py-2 px-3.5 border-accent-primary/30 text-accent-primary hover:bg-accent-primary/10 transition-all rounded-xl relative shadow-sm font-medium"
            >
              <MessageSquare size={15} />
              <span>توصية أو استفسار 💬</span>
              {hasUnreadReplies && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse absolute -top-1 -right-1" title="لديك رد جديد!" />
              )}
            </button>

            {/* 2. Glass Capsule Dropdown for All External Links & App Download */}
            {userData?.status !== 'suspended' && (appLinks.directDownloadLink || appLinks.platformLink || appLinks.developerLink || (userData?.eulaAccepted)) && (
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`btn-secondary flex items-center gap-2 text-xs py-2 px-3.5 border-white/10 text-slate-200 hover:bg-white/10 transition-all rounded-xl font-medium ${isMoreMenuOpen ? 'bg-white/15 border-accent-primary/50 text-accent-primary' : ''
                    }`}
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>روابط وإرشادات 🔗</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isMoreMenuOpen ? 'rotate-180 text-accent-primary' : 'text-slate-400'}`} />
                </button>

                {/* Dropdown Popover */}
                {isMoreMenuOpen && (
                  <>
                    {/* Backdrop for closing dropdown */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMoreMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-60 glass-panel border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 animate-slideDown bg-[#0f172a]/95 backdrop-blur-xl flex flex-col gap-1">
                      {appLinks.directDownloadLink && (
                        <a
                          href={sanitizeUrl(appLinks.directDownloadLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsMoreMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-colors font-medium border border-purple-500/20"
                        >
                          <Download size={15} className="text-purple-400 animate-pulse" />
                          <span className="flex-1">تحميل التطبيق المباشر (APK) 📥</span>
                          <ExternalLink size={12} className="text-purple-400" />
                        </a>
                      )}

                      {appLinks.platformLink && (
                        <a
                          href={sanitizeUrl(appLinks.platformLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsMoreMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <Globe size={15} className="text-cyan-400" />
                          <span className="flex-1">رابط المنصة الرسمي</span>
                          <ExternalLink size={12} className="text-slate-500" />
                        </a>
                      )}

                      {appLinks.developerLink && (
                        <a
                          href={sanitizeUrl(appLinks.developerLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsMoreMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <ShieldCheck size={15} className="text-indigo-400" />
                          <span className="flex-1">موقع المطور</span>
                          <ExternalLink size={12} className="text-slate-500" />
                        </a>
                      )}

                      {userData?.eulaAccepted && (
                        <button
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setIsEulaOpen(true);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-right w-full"
                        >
                          <FileText size={15} className="text-emerald-400" />
                          <span className="flex-1">الشروط وسياسة الخصوصية</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {userData?.status === 'suspended' ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-2xl w-full mx-auto my-8">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">تم تعليق حسابك</h2>
          <p className="text-slate-400 mb-4">
            عذراً، تم إيقاف حسابك مؤقتاً بواسطة الإدارة. يمكنك التواصل مع الدعم الفني من الزر بالأعلى للاستفسار.
          </p>
          {userData.suspensionReason && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-right mx-auto max-w-md">
              <span className="font-bold">سبب التعليق: </span>
              {userData.suspensionReason}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Subscription Status Card */}
          <SubscriptionStatusCard
            currentUser={currentUser}
            userData={userData}
            isSubscribed={isSubscribed}
            endDate={endDate}
          />

          {/* Paywall / Subscription Section */}
          {userData?.role !== 'admin' && (
            <div className="flex flex-col gap-4">
              {/* Tabs Navigation */}
              <div className="flex gap-2 p-1 bg-white/5 border border-glass-border rounded-xl w-fit">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'payment' ? 'bg-accent-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  onClick={() => setActiveTab('payment')}
                >
                  💳 تجديد الاشتراك (دفع)
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'vip' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  onClick={() => setActiveTab('vip')}
                >
                  🎁 لدي كود تفعيل فوري (VIP)
                </button>
              </div>

              {/* Tab Content */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'vip' ? (
                  <ActivationCodeForm
                    onActivate={handleActivateCode}
                    loading={activationLoading}
                  />
                ) : (
                  <RenewalSection
                    currentUser={currentUser}
                    plans={plans}
                    userRequest={userRequest}
                    requestLoading={requestLoading}
                    vodafoneNumber={vodafoneNumber}
                    instapayLink={instapayLink}
                    paypalLink={paypalLink}
                    onSubmitPaymentRequest={handleSubmitPaymentRequest}
                    onDismissRequest={handleDismissRequest}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Password Change Section - Bottom (hidden for suspended accounts) */}
      {userData?.status !== 'suspended' && (
        <PasswordChangeForm
          isGoogleUser={isGoogleUser}
          onChangePassword={handleChangePassword}
          onResetPassword={handleResetPassword}
          loading={passwordLoading}
        />
      )}

      {/* Support & Feedback Modal */}
      {userData?.role !== 'admin' && (
        <SupportModal
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
        />
      )}

      {/* EULA Modal (Read Only) */}
      {isEulaOpen && (
        <EulaModal
          readOnly={true}
          onClose={() => setIsEulaOpen(false)}
        />
      )}
    </div>
  );
};

export default Profile;
