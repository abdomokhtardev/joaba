# جُعْبَة — منظومة الإنتاجية الشاملة 🚀

> **جُعْبَة** هي منصة SaaS متكاملة تجمع إدارة المهام والمشاريع، تتبع العادات اليومية، تدوين اليوميات، وخزنة الروابط — في مكان واحد بتصميم عصري يدعم العربية بالكامل.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-10.14-FFCA28?logo=firebase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)

---

## ✨ الميزات الرئيسية

### 📋 إدارة المهام (Dashboard)
- قائمة مهام يومية مع فلترة: اليوم / غداً / لاحقاً / بدون تاريخ
- أولويات مصفوفة أيزنهاور (مهم وعاجل / مهم / عاجل / عادي)
- تقدير الوقت وتسجيل ساعات الإنجاز الفعلي
- مهام فرعية (Subtasks) قابلة للتعليم والتتبع
- تحديد وحذف متعدد في آن واحد
- احتفالية Confetti عند إنجاز المهام

### ⏳ مؤقت بومودورو المدمج (Pomodoro Timer)
- جلسات تركيز قابلة للتخصيص: [5] [10] [15] [25] [45] [60] دقيقة
- استراحات قصيرة (5د) وطويلة (15د)
- تسجيل تلقائي لساعات العمل الفعلية في المهمة
- تنبيه صوتي هادئ عند انتهاء الجلسة (Web Audio API)

### 📁 المشاريع ومساحات العمل (Projects & Workspaces)
- إنشاء مشاريع مع موعد تسليم ونظام تبويبات مرن (مهام / ملاحظات)
- شريط تقدم مرئي بنسبة مئوية لكل مشروع
- إعادة ترتيب التبويبات والمهام بالسحب والإفلات
- أرشفة المشاريع المكتملة تلقائياً

### 🎯 تتبع العادات (Habits Tracker)
- إنشاء عادات بألوان مميزة وأيام تكرار مخصصة
- شريط تقدم لآخر 35 يوم مع نظام الاستمرارية (Streak) الذكي
- شبكة إنجاز سنوية GitHub-style مع توهج ديناميكي بلون العادة
- أوسمة وميداليات تُفتح تلقائياً عند الوصول لـ Milestones
- تعديل اسم العادة مباشرةً بالضغط المزدوج

### 📓 اليوميات (Journal)
- تدوين اليوميات مع تصنيف المشاعر وحقل الامتنان
- عرض أسبوعي تفاعلي للتنقل بين الأيام
- أرشيف سنوي شهري مع مؤشر الكثافة التدوينية

### 🔗 خزنة الروابط (Links Vault)
- حفظ الروابط بتصنيفات مخصصة ومصفوفة الأولويات
- بحث فوري في العنوان والرابط والتصنيف
- أرشفة، نسخ فوري للرابط، حذف جماعي
- إعادة ترتيب بالسحب والإفلات
- إدارة التصنيفات: تعديل، حذف مع نقل الروابط لتصنيف "عام"

### 📊 تحليلات الإنتاجية (Productivity Insights)
- رسم بياني لآخر 7 أيام (مهام + عادات) مع تمييز الأيام المميزة
- إجمالي ساعات التركيز، ومجموع العادات الأسبوعية
- توزيع نسبي للمهام حسب مصفوفة أيزنهاور

### 💳 نظام الاشتراكات SaaS
- جدار حظر ذكي (Paywall) للحسابات المنتهية
- باقات اشتراك متعددة (شهري / ربع سنوي / سنوي) من لوحة التحكم
- طرق دفع متعددة: فودافون كاش، إنستاباي، باي بال
- رفع إيصال التحويل مع ضغط محلي بـ Canvas/Base64
- كوبونات الخصم الترويجية مع حد أقصى للاستخدام
- أكواد التفعيل VIP الفورية
- نظام المسوقين (Affiliates) مع تتبع روابط الإحالة

### 🔔 الإشعارات والدعم الفني
- إرسال تنبيهات عامة لكل المستخدمين من لوحة التحكم
- جرس إشعارات مدمج مع نقطة حمراء للتنبيهات الجديدة
- نظام التذاكر (Tickets) للدعم الفني مع إمكانية رد الإدارة

### 🛡️ لوحة تحكم الإدارة (Admin Dashboard)
- إدارة المستخدمين: عرض، إيقاف مع سبب، حذف
- مراجعة طلبات الدفع وقبولها أو رفضها مع ملاحظة
- إدارة أكواد التفعيل والخصم بالجملة
- تتبع المسوقين وعمولاتهم
- إعدادات المنصة: الأسعار، طرق الدفع، البانر الإعلاني، روابط التطبيق

---

## 🔒 الأمان (Firestore Security Rules)

- قواعد أمان صارمة: كل collection مربوطة بـ userId == request.auth.uid
- مستخدم لا يستطيع رؤية أو تعديل بيانات مستخدم آخر
- 
ole و status محمية — المستخدم العادي لا يستطيع تغييرهما
- حد أقصى على استعلامات العامة (.limit(1)) لمنع استخراج قاعدة البيانات
- /{document=**}: allow read, write: if false; يمنع الوصول لأي Collection غير معرّفة
- الأدمن وحده يملك صلاحيات الكتابة على collections الحساسة

---

## 🏗️ هيكلة المشروع

\\\
src/
├── App.jsx                    # المكون الرئيسي + Toaster
├── main.jsx                   # نقطة الدخول
├── router.jsx                 # التوجيه (Lazy Loaded Chunks)
├── firebase.js                # إعداد Firebase SDK
├── index.css                  # Design System + Tailwind
│
├── components/
│   ├── Layout.jsx             # Sidebar + Bottom Navigation
│   ├── PomodoroModal.jsx      # مؤقت بومودورو
│   ├── ProductivityInsights.jsx
│   ├── TaskItem.jsx / TaskForm.jsx / CompletionModal.jsx
│   ├── NoteItem.jsx / NoteForm.jsx
│   ├── SupportModal.jsx       # نموذج الدعم الفني
│   ├── habits/
│   │   ├── HabitsTracker.jsx  # الواجهة الرئيسية
│   │   ├── HabitItem.jsx      # بطاقة العادة
│   │   └── HabitDetails.jsx   # السجل السنوي + الميداليات
│   ├── links/
│   │   ├── LinkForm.jsx / LinkCard.jsx / CategoryManagerModal.jsx
│   ├── journal/
│   │   ├── JournalForm.jsx / JournalEntryViewer.jsx
│   │   ├── JournalDateNavigator.jsx / RecentEntriesList.jsx
│   ├── projects/
│   │   ├── ProjectSidebar.jsx / ProjectHeader.jsx
│   │   ├── TaskTabContent.jsx / NoteTabContent.jsx
│   ├── profile/
│   │   ├── SubscriptionStatusCard.jsx / ActivationCodeForm.jsx
│   │   ├── RenewalSection.jsx / PasswordChangeForm.jsx
│   └── admin/
│       ├── RequestsTab.jsx / HistoryTab.jsx / UsersTab.jsx
│       ├── CodesTab.jsx / AffiliatesTab.jsx
│       ├── SettingsTab.jsx / TicketsTab.jsx / PromoCodesTab.jsx
│
├── pages/
│   ├── Dashboard.jsx / ProjectsHub.jsx / ProjectWorkspace.jsx
│   ├── LinksVault.jsx / Journal.jsx / Profile.jsx
│   ├── AdminDashboard.jsx / Login.jsx / Signup.jsx
│
├── contexts/
│   └── AuthContext.jsx         # حالة المصادقة + بيانات المستخدم
│
└── utils/
    ├── audioUtils.js           # Web Audio API (بدون ملفات خارجية)
    ├── dateUtils.js            # تواريخ + تنسيق عربي
    ├── imageUtils.js           # ضغط الصور بـ Canvas
    ├── constants.js            # ثوابت: أولويات، خطط افتراضية
    ├── priceUtils.js           # حساب السعر بعد الخصم
    ├── habitColors.js          # ألوان العادات (مصدر موحد)
    ├── firestoreErrorUtils.js  # معالجة أخطاء Firestore بالعربية
    ├── toastUtils.jsx          # showDeleteConfirm مشتركة
    └── userUtils.js            # تهيئة وثيقة المستخدم الجديد
\\\

---

## ⚙️ الإعداد والتشغيل

### المتطلبات
- Node.js 18+
- مشروع Firebase (Firestore + Authentication)

### التثبيت
\\\ash
git clone <repo-url>
cd "Managment Tasks"
npm install
\\\

### إعداد متغيرات البيئة
أنشئ ملف \.env\ في جذر المشروع:
\\\env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
\\\

> **ملاحظة:** ملف \secret.json\ مخصص لرفع المتغيرات على Cloudflare Workers عبر \wrangler secret bulk ./secret.json\ وهو **مستثنى من Git** دائماً.

### التشغيل
\\\ash
npm run dev      # تشغيل محلي على localhost:5173
npm run build    # بناء الإنتاج (Chunked)
npm run preview  # معاينة البناء محلياً
\\\

### نشر قواعد Firestore
\\\ash
firebase deploy --only firestore:rules
\\\

---

## 🛠️ التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|---|---|---|
| React | 18.3 | واجهة المستخدم |
| Firebase | 10.14 | Firestore + Auth + Analytics |
| TailwindCSS | 3.4 | التنسيق والـ Design System |
| Vite | 5.4 | Build tool + Code Splitting |
| react-router-dom | 6.x | التوجيه والـ Lazy Loading |
| react-hot-toast | 2.x | إشعارات التفاعل |
| react-confetti | 6.x | احتفالية إنجاز المهام |
| lucide-react | 0.468 | الأيقونات |
| Web Audio API | Native | الأصوات التفاعلية |

---

## 📄 الوثائق الإضافية

- [مواصفات نظام الدفع والاشتراكات](./PAYMENT_SUBSCRIPTION_SPEC.md)
- [مواصفات نظام الدعم الفني](./SUPPORT_SYSTEM_SPEC.md)
