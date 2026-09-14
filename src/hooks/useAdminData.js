import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot, doc, updateDoc,
  getDoc, setDoc, addDoc, serverTimestamp, getDocs, increment,
  deleteDoc, arrayUnion
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { DEFAULT_PLANS } from '../utils/constants';
import { bulkDeleteDocs } from '../utils/firestoreUtils';

export const useAdminData = (activeTab) => {
  // Data State
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [validCodes, setValidCodes] = useState([]);
  const [usedCodes, setUsedCodes] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [unseenHistoryCount, setUnseenHistoryCount] = useState(0);
  const [usersMap, setUsersMap] = useState({});

  // Settings State
  const [settings, setSettings] = useState({
    freeTrialDays: 7,
    plans: DEFAULT_PLANS,
    vodafoneNumber: '01029060019',
    instapayLink: '',
    paypalLink: '',
    bannerSettings: { isActive: false, discountCode: '', discountPercent: 10, message: '' },
    platformLink: '',
    directDownloadLink: '',
    developerLink: ''
  });

  // Listeners
  useEffect(() => {
    // 1. Payment Requests Listener
    const unReq = onSnapshot(collection(db, 'payment_requests'), (snap) => {
      const allRequests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const pending = allRequests
        .filter((d) =>
          d.status === 'pending' ||
          (d.status === 'archived' && !d.approvedAt && !d.rejectedAt && !d.rejectionNote)
        )
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setPendingRequests(pending);

      const history = allRequests
        .map((data) => {
          let effectiveStatus = data.status;
          if (data.status === 'archived') {
            if (data.approvedAt) effectiveStatus = 'approved';
            else if (data.rejectedAt || data.rejectionNote) effectiveStatus = 'rejected';
          }
          return { ...data, status: effectiveStatus };
        })
        .filter((r) => r.status === 'approved' || r.status === 'rejected')
        .sort((a, b) => {
          const tA = a.approvedAt?.toMillis?.() || a.rejectedAt?.toMillis?.() || 0;
          const tB = b.approvedAt?.toMillis?.() || b.rejectedAt?.toMillis?.() || 0;
          return tB - tA;
        });
      setHistoryRequests(history);
    });

    // 2. Activation Codes Listeners
    const unCodes = onSnapshot(
      query(collection(db, 'activation_codes'), where('isValid', '==', true)),
      (snap) => setValidCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unUsedCodes = onSnapshot(
      query(collection(db, 'activation_codes'), where('isValid', '==', false)),
      (snap) => setUsedCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // 3. Affiliates Listener
    const unAff = onSnapshot(collection(db, 'affiliates'), (snap) =>
      setAffiliates(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // 4. Support Tickets Listener
    const unTickets = onSnapshot(collection(db, 'support_tickets'), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setTickets(list);
    });

    // 5. Promo Codes Listener
    const unPromo = onSnapshot(collection(db, 'promo_codes'), (snap) =>
      setPromoCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // 6. Settings Fetch
    getDoc(doc(db, 'settings', 'general')).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings((prev) => ({
          ...prev,
          ...(typeof data.freeTrialDays === 'number' && { freeTrialDays: data.freeTrialDays }),
          ...(Array.isArray(data.plans) && { plans: data.plans }),
          ...(data.banner && { bannerSettings: data.banner }),
          ...(data.vodafoneNumber && { vodafoneNumber: data.vodafoneNumber }),
          instapayLink: data.instapayLink || prev.instapayLink,
          paypalLink: data.paypalLink || prev.paypalLink,
          platformLink: data.platformLink || data.appDownloadLink || prev.platformLink,
          directDownloadLink: data.directDownloadLink || data.googlePlayLink || prev.directDownloadLink,
          developerLink: data.developerLink || prev.developerLink
        }));
      }
    });

    // 7. Users Map Listener
    const unUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.email) map[d.id] = data.email;
      });
      setUsersMap(map);
    });

    return () => {
      unReq();
      unCodes();
      unUsedCodes();
      unAff();
      unTickets();
      unPromo();
      unUsers();
    };
  }, []);

  // Track unread/new transactions count
  useEffect(() => {
    const lastSeenCount = parseInt(localStorage.getItem('admin_last_seen_history_count') || '0', 10);
    if (activeTab === 'history') {
      localStorage.setItem('admin_last_seen_history_count', String(historyRequests.length));
      setUnseenHistoryCount(0);
    } else {
      const diff = Math.max(0, historyRequests.length - lastSeenCount);
      setUnseenHistoryCount(diff);
    }
  }, [historyRequests, activeTab]);

  // Actions
  const handleApproveRequest = async (request, customDays) => {
    try {
      const userRef = doc(db, 'users', request.userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return toast.error('المستخدم غير موجود.');

      const userData = userSnap.data();
      const days = parseInt(customDays, 10) || parseInt(request.planDurationDays, 10) || 30;

      const isFirstSubscription = !userData.hasSubscribedBefore;
      const finalPaidAmount = request.finalPrice !== undefined ? request.finalPrice : (request.planPrice || 0);

      const commissionToAward = finalPaidAmount === 0 ? 0 : (parseInt(request.planCommission, 10) || 10);
      const adminProfit = Math.max(0, finalPaidAmount - commissionToAward);

      const currentEnd = (userData.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date())
        ? new Date(userData.subscriptionEndDate)
        : new Date();
      currentEnd.setDate(currentEnd.getDate() + days);

      await updateDoc(userRef, {
        subscriptionEndDate: currentEnd.toISOString(),
        hasSubscribedBefore: true
      });

      if (userData.referredBy && isFirstSubscription && commissionToAward > 0) {
        const affSnap = await getDocs(query(collection(db, 'affiliates'), where('code', '==', userData.referredBy)));
        if (!affSnap.empty) {
          await updateDoc(doc(db, 'affiliates', affSnap.docs[0].id), {
            pendingCommission: increment(commissionToAward),
            totalGeneratedProfit: increment(adminProfit)
          });
        }
      }

      if (request.promoCodeId) {
        try {
          await updateDoc(doc(db, 'promo_codes', request.promoCodeId), {
            currentUsage: increment(1),
            usedBy: arrayUnion(request.userId, request.email)
          });
        } catch (err) {
          console.error('Error incrementing promo code usage:', err);
        }
      }

      await updateDoc(doc(db, 'payment_requests', request.id), {
        status: 'approved',
        receiptImage: null,
        approvedAt: serverTimestamp()
      });

      toast.success(`تم قبول الطلب وتفعيل الحساب لمدة ${days} يوم!`);
    } catch (error) {
      toast.error('حدث خطأ أثناء القبول.');
    }
  };

  const handleRejectRequest = async (id, note) => {
    try {
      await updateDoc(doc(db, 'payment_requests', id), {
        status: 'rejected',
        rejectionNote: note,
        rejectedAt: serverTimestamp()
      });
      toast.success('تم رفض الطلب وإرسال الملاحظة.');
    } catch (error) {
      toast.error('حدث خطأ.');
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await deleteDoc(doc(db, 'payment_requests', id));
      toast.success('تم حذف السجل بنجاح.');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف.');
    }
  };

  const handleBulkDeleteRequests = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      await bulkDeleteDocs(db, 'payment_requests', ids);
      toast.success(`تم حذف (${ids.length}) معاملة بنجاح.`);
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف المتعدد.');
    }
  };

  const handleGenerateCodes = async (quantity, duration) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateCode = () => {
      let code = 'VIP-';
      for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    try {
      const promises = [];
      for (let i = 0; i < quantity; i++) {
        promises.push(addDoc(collection(db, 'activation_codes'), {
          code: generateCode(),
          durationDays: parseInt(duration, 10),
          isValid: true,
          createdAt: serverTimestamp()
        }));
      }
      await Promise.all(promises);
      toast.success(`تم توليد ${quantity} كود بنجاح! 🎉`);
    } catch (error) {
      toast.error('حدث خطأ أثناء توليد الأكواد.');
    }
  };

  const handleDeleteUsedCodes = async () => {
    if (usedCodes.length === 0) return;
    try {
      await bulkDeleteDocs(db, 'activation_codes', usedCodes.map((c) => c.id));
      toast.success('تم تنظيف وحذف جميع الأكواد المستخدمة! 🧹');
    } catch (error) {
      toast.error('حدث خطأ أثناء التنظيف.');
    }
  };

  const handleDeleteSingleCode = async (id) => {
    try {
      await deleteDoc(doc(db, 'activation_codes', id));
      toast.success('تم حذف الكود بنجاح 🗑️');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الكود.');
    }
  };

  const handleBulkDeleteCodes = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      await bulkDeleteDocs(db, 'activation_codes', ids);
      toast.success(`تم حذف ${ids.length} كود بنجاح! 🗑️`);
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف.');
    }
  };

  const handleAddPromoCode = async (code, discountPercent, maxUsage, targetPlan = 'all') => {
    try {
      const q = query(collection(db, 'promo_codes'), where('code', '==', code));
      const snap = await getDocs(q);
      if (!snap.empty) return toast.error('هذا الكود موجود مسبقاً.');

      await addDoc(collection(db, 'promo_codes'), {
        code,
        discountPercent,
        maxUsage,
        targetPlan,
        currentUsage: 0,
        isActive: true,
        createdAt: serverTimestamp()
      });
      toast.success('تم إضافة كود الخصم بنجاح!');
    } catch (err) {
      toast.error('حدث خطأ أثناء إضافة الكود.');
    }
  };

  const handleDeletePromoCode = async (id) => {
    try {
      await deleteDoc(doc(db, 'promo_codes', id));
      toast.success('تم حذف الكود بنجاح.');
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف.');
    }
  };

  const handleTogglePromoCodeActive = async (id, currentActive) => {
    try {
      await updateDoc(doc(db, 'promo_codes', id), { isActive: !currentActive });
      toast.success(currentActive ? 'تم تعطيل الكود.' : 'تم تفعيل الكود.');
    } catch (err) {
      toast.error('حدث خطأ.');
    }
  };

  const handleCreateAffiliate = async (name, code) => {
    try {
      const q = query(collection(db, 'affiliates'), where('code', '==', code.toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) return toast.error('كود المسوق مستخدم بالفعل.');

      await addDoc(collection(db, 'affiliates'), {
        name,
        code: code.toUpperCase(),
        pendingCommission: 0,
        totalPaid: 0,
        totalGeneratedProfit: 0,
        createdAt: serverTimestamp()
      });
      toast.success('تم إضافة المسوق بنجاح!');
    } catch (error) {
      toast.error('حدث خطأ.');
    }
  };

  const handlePayAffiliate = async (id, amount) => {
    try {
      await updateDoc(doc(db, 'affiliates', id), {
        pendingCommission: increment(-amount),
        totalPaid: increment(amount)
      });
      toast.success(`تم سداد مبلغ ${amount} ج.م للمسوق.`);
    } catch (error) {
      toast.error('حدث خطأ.');
    }
  };

  const handleDeleteAffiliate = async (id) => {
    try {
      await deleteDoc(doc(db, 'affiliates', id));
      toast.success('تم حذف المسوق بنجاح.');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف.');
    }
  };

  const handleReplyTicket = async (ticketId, replyText) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        adminReply: replyText,
        status: 'replied',
        repliedAt: serverTimestamp()
      });
      toast.success('تم إرسال الرد للمستخدم بنجاح! ✉️');
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال الرد.');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      await deleteDoc(doc(db, 'support_tickets', ticketId));
      toast.success('تم حذف الرسالة.');
    } catch (error) {
      toast.error('حدث خطأ.');
    }
  };

  const handleSaveSettings = async (settingsData) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), settingsData, { merge: true });
      setSettings((prev) => ({ ...prev, ...settingsData }));
      toast.success('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات.');
    }
  };

  return {
    pendingRequests,
    historyRequests,
    validCodes,
    usedCodes,
    promoCodes,
    affiliates,
    tickets,
    unseenHistoryCount,
    setUnseenHistoryCount,
    usersMap,
    settings,
    handleApproveRequest,
    handleRejectRequest,
    handleDeleteRequest,
    handleBulkDeleteRequests,
    handleGenerateCodes,
    handleDeleteUsedCodes,
    handleDeleteSingleCode,
    handleBulkDeleteCodes,
    handleAddPromoCode,
    handleDeletePromoCode,
    handleTogglePromoCodeActive,
    handleCreateAffiliate,
    handlePayAffiliate,
    handleDeleteAffiliate,
    handleReplyTicket,
    handleDeleteTicket,
    handleSaveSettings
  };
};
