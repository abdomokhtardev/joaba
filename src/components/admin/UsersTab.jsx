import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Users, Ban, CheckCircle2, Trash2, Search, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../../utils/toastUtils';

const UsersTab = () => {
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, userId: null, currentStatus: null });
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSuspendClick = (userId, currentStatus) => {
    if (currentStatus === 'suspended') {
      handleSuspend(userId, currentStatus, '');
    } else {
      setSuspensionReason('');
      setSuspendModal({ isOpen: true, userId, currentStatus });
    }
  };

  const handleSuspend = async (userId, currentStatus, reason) => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        suspensionReason: newStatus === 'suspended' ? (reason || 'لم يتم تحديد سبب، لمخالفة الشروط.') : ''
      });
      toast.success(newStatus === 'suspended' ? 'تم إيقاف حساب المستخدم بنجاح.' : 'تم تفعيل حساب المستخدم بنجاح.');
    } catch (err) {
      toast.error('حدث خطأ أثناء تغيير حالة المستخدم.');
    } finally {
      setSuspendModal({ isOpen: false, userId: null, currentStatus: null });
    }
  };

  const handleDelete = async (userId) => {
    showDeleteConfirm(
      'هل أنت متأكد من حذف هذا المستخدم نهائياً من قاعدة البيانات؟ لن يتمكن من تسجيل الدخول وسيفقد كافة بياناته.',
      async () => {
        try {
          await deleteDoc(doc(db, 'users', userId));
          toast.success('تم حذف المستخدم بنجاح.');
        } catch (err) {
          toast.error('حدث خطأ أثناء حذف المستخدم.');
        }
      }
    );
  };

  const filteredUsers = usersList.filter(u => 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="text-accent-primary" />
            إدارة المستخدمين
          </h2>
          <p className="text-sm text-slate-400 mt-1">عرض، إيقاف، أو حذف حسابات المستخدمين.</p>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-accent-primary transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="البحث بالاسم أو البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass w-full sm:w-72 pr-10 pl-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-accent-primary/50 focus:bg-white/10 transition-all text-sm outline-none text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="bg-white/5 border border-glass-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">جاري تحميل المستخدمين...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">لا يوجد مستخدمين لعرضهم.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
                  <th className="px-4 py-3 font-medium">الاشتراك</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">تاريخ الانضمام</th>
                  <th className="px-4 py-3 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/50">
                {filteredUsers.map((u) => {
                  const isSuspended = u.status === 'suspended';
                  const isSubscribed = u.subscriptionEndDate && new Date(u.subscriptionEndDate) > new Date();
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className={`hover:bg-white/5 transition-colors ${isSuspended ? 'opacity-70' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{u.displayName || 'بدون اسم'}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                        {isAdmin && <span className="inline-block mt-1 text-[10px] bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">أدمن</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isSubscribed ? (
                          <div className="text-emerald-400 text-xs">
                            نشط حتى {new Date(u.subscriptionEndDate).toLocaleDateString('ar-EG')}
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs">غير مشترك / منتهي</div>
                        )}
                        {!u.hasSubscribedBefore && (
                          <div className="text-[10px] text-yellow-500 mt-1">لم يشترك مسبقاً</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isSuspended ? (
                          <span className="text-red-400 text-xs flex items-center gap-1">
                            <Ban size={12} /> موقوف
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-xs flex items-center gap-1">
                            <CheckCircle2 size={12} /> نشط
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {u.createdAt ? new Date(u.createdAt.toDate()).toLocaleDateString('ar-EG') : 'غير معروف'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isAdmin ? (
                            <span className="text-xs text-slate-500">لا يمكن تعديل الأدمن</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSuspendClick(u.id, u.status)}
                                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                                  isSuspended 
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                  : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                                }`}
                                title={isSuspended ? 'تفعيل الحساب' : 'إيقاف الحساب'}
                              >
                                {isSuspended ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                                {isSuspended ? 'تفعيل' : 'إيقاف'}
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1 text-xs"
                                title="حذف نهائي"
                              >
                                <Trash2 size={14} />
                                حذف
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspension Modal */}
      {suspendModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900/90 shadow-2xl shadow-red-500/10">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Ban size={24} />
              </div>
              <h3 className="text-xl font-bold">إيقاف حساب مستخدم</h3>
            </div>
            
            <p className="text-slate-300 text-sm mb-4">
              أنت على وشك إيقاف هذا الحساب. لن يتمكن المستخدم من الوصول إلى لوحة تحكمه حتى تقوم بإعادة تفعيله.
            </p>

            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2 font-medium">سبب الإيقاف (سيظهر للمستخدم):</label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="مثال: انتهاك سياسة الاستخدام، يرجى التواصل مع الدعم..."
                className="input-glass w-full h-24 resize-none bg-white/5 border border-white/10 rounded-xl p-3 focus:border-red-500/50 focus:bg-white/10 transition-all text-sm outline-none text-slate-200"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSuspend(suspendModal.userId, suspendModal.currentStatus, suspensionReason)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/25"
              >
                تأكيد الإيقاف
              </button>
              <button
                onClick={() => setSuspendModal({ isOpen: false, userId: null, currentStatus: null })}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-glass-border"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;
