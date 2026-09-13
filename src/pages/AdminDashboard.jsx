import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, setDoc, addDoc, serverTimestamp, getDocs, increment, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { ShieldCheck, Activity, Users, Settings, KeyRound, Tag, History, MessageSquare, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_PLANS } from '../utils/constants';

import RequestsTab from '../components/admin/RequestsTab';
import HistoryTab from '../components/admin/HistoryTab';
import CodesTab from '../components/admin/CodesTab';
import AffiliatesTab from '../components/admin/AffiliatesTab';
import SettingsTab from '../components/admin/SettingsTab';
import SupportTab from '../components/admin/SupportTab';
import PromoCodesTab from '../components/admin/PromoCodesTab';
import AnnouncementsTab from '../components/admin/AnnouncementsTab';
import UsersTab from '../components/admin/UsersTab';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('requests');

  // Firestore Data State
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [validCodes, setValidCodes] = useState([]);
  const [usedCodes, setUsedCodes] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [unseenHistoryCount, setUnseenHistoryCount] = useState(0);
  const [usersMap, setUsersMap] = useState({});

  // Settings State — merged into a single object to reduce re-renders
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

  useEffect(() => {
    // 1. Single listener for payment_requests — derives both pending and history
    const unReq = onSnapshot(collection(db, 'payment_requests'), (snap) => {
      const allRequests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Pending: explicitly pending OR archived without a decision (mistakenly archived)
      const pending = allRequests
        .filter((d) =>
          d.status === 'pending' ||
          (d.status === 'archived' && !d.approvedAt && !d.rejectedAt && !d.rejectionNote)
        )
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setPendingRequests(pending);

      // History: approved + rejected (recover archived records that were actually decided)
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

    // 3. Activation codes
    const unCodes = onSnapshot(
      query(collection(db, 'activation_codes'), where('isValid', '==', true)),
      (snap) => setValidCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unUsedCodes = onSnapshot(
      query(collection(db, 'activation_codes'), where('isValid', '==', false)),
      (snap) => setUsedCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // 4. Affiliates
    const unAff = onSnapshot(collection(db, 'affiliates'), (snap) =>
      setAffiliates(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // 5. Support tickets (sorted newest first)
    const unTickets = onSnapshot(collection(db, 'support_tickets'), (snap) => {
      const tList = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setTickets(tList);
    });

    // 6. Promo codes
    const unPromo = onSnapshot(collection(db, 'promo_codes'), (snap) =>
      setPromoCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // 7. Fetch general settings once
    getDoc(doc(db, 'settings', 'general')).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({
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

    // 8. Users map for email resolution
    const unUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.email) map[d.id] = data.email;
      });
      setUsersMap(map);
    });

    return () => {
      unReq(); unCodes(); unUsedCodes(); unAff(); unTickets(); unPromo(); unUsers();
    };
  }, []);

  // Track unread/new transactions count (clears when activeTab is history)
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

  // -- Handlers --

  const handleApproveRequest = async (request, customDays) => {
    try {
      const userRef = doc(db, 'users', request.userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return toast.error('المستخدم غير موجود.');

      const userData = userSnap.data();
      const days = parseInt(customDays, 10) || parseInt(request.planDurationDays, 10) || 30;
      
      const isFirstSubscription = !userData.hasSubscribedBefore;
      const finalPaidAmount = request.finalPrice !== undefined ? request.finalPrice : (request.planPrice || 0);
      
      // If 100% discount code (finalPaidAmount === 0), commission and profit are 0 so balance never goes negative
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
          console.error("Error incrementing promo code usage:", err);
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
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        batch.delete(doc(db, 'payment_requests', id));
      });
      await batch.commit();
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
      await Promise.all(usedCodes.map((c) => deleteDoc(doc(db, 'activation_codes', c.id))));
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
      await Promise.all(ids.map((id) => deleteDoc(doc(db, 'activation_codes', id))));
      toast.success(`تم حذف ${ids.length} كود بنجاح! 🗑️`);
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف.');
    }
  };

  const handleCreateAffiliate = async (name, code) => {
    try {
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
      // Sync relevant keys back to local state
      setSettings(prev => ({ ...prev, ...settingsData }));
      toast.success('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات.');
    }
  };

  const pendingTicketsCount = tickets.filter((t) => t.status === 'pending').length;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="mb-2">
        <h1 className="text-3xl text-slate-50 mb-2 flex items-center gap-3">
          <ShieldCheck className="text-accent-primary" size={32} />
          لوحة تحكم الإدارة
        </h1>
        <p className="text-slate-400">إدارة الاشتراكات، الأكواد، المسوقين، والشكاوى.</p>
      </header>

      {/* Tabs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-2">
        {[
          { id: 'requests', label: 'الطلبات المعلقة', icon: Activity, count: pendingRequests.length },
          { id: 'history', label: 'سجل المعاملات', icon: History, count: unseenHistoryCount },
          { id: 'codes', label: 'أكواد التفعيل', icon: KeyRound },
          { id: 'promos', label: 'كوبونات الخصم', icon: Tag },
          { id: 'users', label: 'المستخدمين', icon: Users },
          { id: 'affiliates', label: 'المسوقين', icon: Users },
          { id: 'announcements', label: 'الإشعارات', icon: Bell },
          { id: 'support', label: 'الشكاوى والتوصيات', icon: MessageSquare, count: pendingTicketsCount },
          { id: 'settings', label: 'الإعدادات', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'history') {
                localStorage.setItem('admin_last_seen_history_count', String(historyRequests.length));
                setUnseenHistoryCount(0);
              }
            }}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-medium text-sm transition-all border ${
              activeTab === tab.id
                ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.15)]'
                : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10 hover:text-slate-50 hover:border-white/20'
            }`}
          >
            <div className="relative">
              <tab.icon size={24} className={activeTab === tab.id ? 'text-accent-primary' : 'text-slate-400'} />
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`absolute -top-2 -right-2 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md ${
                  activeTab === tab.id ? 'bg-accent-primary text-white' : 'bg-red-500 text-white'
                }`}>
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </div>
            <span className="text-center">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="glass-panel p-6 min-h-[400px]">
        {activeTab === 'requests' && (
          <RequestsTab
            pendingRequests={pendingRequests}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab 
            historyRequests={historyRequests} 
            onDeleteRequest={handleDeleteRequest}
            onBulkDeleteRequests={handleBulkDeleteRequests}
          />
        )}

        {activeTab === 'codes' && (
          <CodesTab 
            validCodes={validCodes} 
            usedCodes={usedCodes} 
            usersMap={usersMap}
            onGenerateCodes={handleGenerateCodes} 
            onDeleteUsedCodes={handleDeleteUsedCodes}
            onDeleteSingleCode={handleDeleteSingleCode}
            onBulkDeleteCodes={handleBulkDeleteCodes}
          />
        )}

        {activeTab === 'promos' && (
          <PromoCodesTab
            promoCodes={promoCodes}
            plans={settings.plans}
            onAddPromoCode={handleAddPromoCode}
            onDeletePromoCode={handleDeletePromoCode}
            onTogglePromoCodeActive={handleTogglePromoCodeActive}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTab />
        )}

        {activeTab === 'affiliates' && (
          <AffiliatesTab
            affiliates={affiliates}
            onCreateAffiliate={handleCreateAffiliate}
            onPayAffiliate={handlePayAffiliate}
            onDeleteAffiliate={handleDeleteAffiliate}
          />
        )}

        {activeTab === 'support' && (
          <SupportTab
            tickets={tickets}
            onReplyTicket={handleReplyTicket}
            onDeleteTicket={handleDeleteTicket}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            initialFreeTrialDays={settings.freeTrialDays} 
            initialPlans={settings.plans} 
            initialBanner={settings.bannerSettings} 
            initialVodafoneNumber={settings.vodafoneNumber}
            initialInstapayLink={settings.instapayLink}
            initialPaypalLink={settings.paypalLink}
            initialPlatformLink={settings.platformLink}
            initialDirectDownloadLink={settings.directDownloadLink}
            initialDeveloperLink={settings.developerLink}
            onSaveSettings={handleSaveSettings} 
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
