# دليل وتوثيق نظام الدفع والاشتراكات (SaaS Billing & Subscription System)

> **الهدف:** هذا المستند يمثل المواصفات الهندسية والبرمجية الكاملة لنظام الاشتراكات والدفع وإدارة المسوقين لنسخه أو تطبيقه بواسطة أي مطور أو نموذج ذكاء اصطناعي (AI) في أي مشروع ويب أو تطبيق موبايل.

*للاطلاع على نظام الدعم الفني والشكاوى، راجع [SUPPORT_SYSTEM_SPEC.md](file:///f:/React-Projects/Managment%20Tasks/SUPPORT_SYSTEM_SPEC.md).*

---

## 1. المعمارية العامة للنظام (Architecture Overview)

النظام مصمم كنموذج **SaaS شبه آلي (Semi-Automated SaaS)** يعتمد على التحويل المباشر عبر المحافظ الإلكترونية (مثل فودافون كاش) مع لوحة تحكم إدارية ونظام أكواد ونظام إحالة (Affiliates).

```
                      ┌───────────────────────────────────────┐
                      │          مستخدم جديد (Signup)          │
                      └──────────────────┬────────────────────┘
                                         │
                   يتم منحه فترة تجريبية مجانية (مثلاً 7 أيام)
                   تسجيل كود الإحالة إن وجد (?ref=CODE)
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │          فترة الاستخدام النشط         │
                      └──────────────────┬────────────────────┘
                                         │
                                   انتهاء المدة
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │    جدار الحظر / الدفع (Paywall)        │
                      │  يُحجب الوصول لجميع الصفحات عدا الملف  │
                      └──────────────────┬────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
      ┌─────────────────────────┐                 ┌─────────────────────────┐
      │  تفعيل فوري عبر كود     │                 │   طلب دفع وتحويل بنكي   │
      │  (Activation Code)      │                 │   (Payment Request)     │
      └────────────┬────────────┘                 └────────────┬────────────┘
                   │                                           │
          التحقق من الكود                                رفع صورة إيصال
          وتمديد الحساب فوراً                           (مضغوطة Base64)
                                                               │
                                                               ▼
                                                  ┌─────────────────────────┐
                                                  │  مراجعة الأدمن للطلب     │
                                                  │  لوحة التحكم (Dashboard) │
                                                  └────────────┬────────────┘
                                                               │
                                              ┌────────────────┴────────────────┐
                                              ▼                                 ▼
                                       [موافقة Approve]                  [رفض Reject]
                                              │                                 │
                                   - تمديد حساب المستخدم              - كتابة سبب الرفض
                                   - إضافة عمولة المسوق               - يظهر إشعار بالملف
                                   - تفريغ صورة الإيصال                 مع زر إخفاء (X)
                                     لتوفير المساحة 95%
```

---

## 2. هيكل البيانات في Firestore (Database Schema)

### 2.1 مجموعة المستخدمين: `users/{userId}`
```json
{
  "email": "user@example.com",
  "role": "user", // "user" أو "admin"
  "subscriptionEndDate": "2026-09-14T00:00:00.000Z", // ISO String
  "referredBy": "OMAR20", // كود المسوق أو null
  "hasSubscribedBefore": false, // لتحديد ما إذا كان المستخدم قد اشترك مسبقاً (لصرف العمولة مرة واحدة)
  "createdAt": "Timestamp"
}
```

### 2.2 مجموعة طلبات الدفع: `payment_requests/{requestId}`
```json
{
  "userId": "firebase_auth_uid",
  "email": "user@example.com",
  "phoneTransfer": "01012345678", // رقم المحفظة المحول منها أو الإيميل لو كان الدفع عبر رابط
  "receiptImage": "data:image/jpeg;base64,...", // يتم تفريغها إلى null بعد القبول
  "status": "pending", // "pending" | "approved" | "rejected" | "archived"
  "rejectionNote": "", // سبب الرفض إن وجد
  "planId": "monthly",
  "planName": "شهري",
  "planPrice": 100, // السعر بعد الخصم
  "planDurationDays": 30,
  "planCommission": 20, // عمولة المسوق بالجنيه
  "createdAt": "Timestamp",
  "approvedAt": "Timestamp" // اختياري عند الموافقة
}
```

### 2.3 مجموعة أكواد التفعيل: `activation_codes/{codeId}`
```json
{
  "code": "VIP-ABCD-1234",
  "durationDays": 30,
  "isValid": true, // تصبح false بعد الاستخدام
  "usedBy": "user@example.com", // إيميل المستخدم الذي استهلكه
  "usedAt": "Timestamp",
  "createdAt": "Timestamp"
}
```

### 2.4 مجموعة المسوقين: `affiliates/{affiliateId}`
```json
{
  "name": "عمر أحمد",
  "code": "OMAR20", // كود الإحالة (Unique Uppercase)
  "pendingCommission": 60, // الرصيد المستحق الدفع (ج.م)
  "totalPaid": 200, // إجمالي ما تم سحبه وسداده (ج.م)
  "totalGeneratedProfit": 800, // إجمالي الربح الصافي للإدارة من هذا المسوق (يمكن أن يكون سالباً إذا تم الدفع على خصم 100%)
  "createdAt": "Timestamp"
}

### 2.5 مجموعة أكواد الخصم: `promo_codes/{codeId}`
```json
{
  "code": "FREE100",
  "discountPercent": 100,
  "isActive": true,
  "maxUsage": 50,
  "currentUsage": 10,
  "usedBy": ["userId1", "userId2"], // لمنع استخدام الكود أكثر من مرة لنفس المستخدم
  "createdAt": "Timestamp"
}
```
```

### 2.5 مستند الإعدادات العامة: `settings/general`
```json
{
  "freeTrialDays": 7,
  "plans": [
    { "id": "monthly", "name": "شهري", "durationDays": 30, "price": 100, "commission": 20 },
    { "id": "quarterly", "name": "3 شهور", "durationDays": 90, "price": 250, "commission": 50 },
    { "id": "yearly", "name": "سنوي", "durationDays": 365, "price": 900, "commission": 150 }
  ],
  "banner": {
    "isActive": true,
    "discountCode": "SUMMER50",
    "discountPercent": 20,
    "message": "خصم حصري لفترة محدودة! استخدم كود"
  }
}
```

---

## 3. دورات العمل التفصيلية (Workflows)

### 3.1 التسجيل والفترة التجريبية (Signup Flow)
1. عند فتح رابط التسجيل، يتم فحص المعامل `?ref=CODE` في الرابط.
2. عند إنشاء الحساب:
   - يتم قراءة `freeTrialDays` من `settings/general` (الافتراضي 7 أيام).
   - يتم حساب تاريخ الانتهاء: `now + freeTrialDays`.
   - يتم حفظ مستند المستخدم في `users/{uid}` بالبيانات المذكورة.

### 3.2 فحص الاشتراك وحظر المنتهي (Paywall Guard)
* **في المكون `ProtectedRoute`:**
  - يتم فحص `userData.role === 'admin'`. إن كان أدمين يُسمح له بالوصول دائماً.
  - إن كان مستخدماً عادياً، يتم مقارنة `new Date() > new Date(userData.subscriptionEndDate)`.
  - إذا انتهى الاشتراك وكان المسار الحالي ليس `/profile`، يتم توجيهه إجبارياً إلى `/profile`.
  - في القائمة الجانبية أو السفلية `Layout`، تقتصر الروابط على رابط الملف الشخصي فقط عند انتهاء الاشتراك.

### 3.3 تطبيق كود الخصم (Discount Code Application)
1. يستمع التطبيق لحظياً (`onSnapshot`) لإعدادات البانر من `settings/general` أو يتم التحقق من مجموعة `promo_codes`.
2. عند كتابة كود الخصم وضغط "تطبيق":
   - يتم التأكد من أن الكود فعال `isActive === true`.
   - يتم فحص `currentUsage < maxUsage`.
   - يتم التأكد أن المعرف الخاص بالمستخدم `uid` غير موجود في مصفوفة `usedBy` لمنع التكرار.
   - عند التطابق، يتم تخزين نسبة الخصم وحساب السعر النهائي: `finalPrice = plan.price - (plan.price * (discountPercent / 100))`.
   - **الذكاء في واجهة المستخدم (UX):** إذا كان الخصم 100% (`finalPrice === 0`)، تختفي حقول رقم الهاتف وإرفاق الإيصال، ويتغير زر الإرسال إلى "تأكيد الاشتراك المجاني".

### 3.4 رفع وضغط الإيصال (Receipt Compression)
* قبل رفع الصورة إلى قاعدة البيانات، يتم ضغطها على جانب العميل (Client-side Canvas):
  - أقصى عرض وأقصى ارتفاع: `800px × 800px`.
  - الجودة (Quality): `0.6` بصيغة JPEG.
  - الحجم الناتج: بين `40 - 100 KB` كنص `data:image/jpeg;base64,...`.
* يتم إرسال طلب الدفع بحالة `pending`.

### 3.5 مراجعة الأدمن والموافقة (Admin Approval & Optimization)
عند ضغط الأدمن على زر **"موافقة"**:
1. جلب مستند المستخدم وتمديد تاريخ الانتهاء بإضافة الأيام المحددة إلى تاريخ انتهائه الحالي (أو تاريخ اليوم إذا كان منتهياً بالفعل)، وتحويل حقل `hasSubscribedBefore` إلى `true`.
2. فحص `userData.referredBy` و `userData.hasSubscribedBefore`: 
   - إذا كان هذا هو **الاشتراك الأول** للمستخدم، يتم صرف العمولة للمسوق بزيادة `pendingCommission` بمقدار `planCommission`، حتى لو كان سعر الاشتراك 0 جنيه (خصم 100%).
   - يتم احتساب `totalGeneratedProfit` بطرح العمولة من المبلغ المدفوع.
3. تسجيل استخدام كود الخصم: إذا كان الطلب يتضمن `promoCodeId`، يضاف `userId` إلى مصفوفة `usedBy` في الكود، وتزاد `currentUsage` بمقدار 1.
4. **توفير المساحة الذكي:** تحديث مستند الطلب ليصبح `status: "approved"` مع وضع `receiptImage: null` لتفريغ صورة الإيصال فوراً بعد مراجعتها والتأكد منها.

### 3.6 تفعيل الأكواد (VIP Activation Codes)
1. يكتب المستخدم الكود في حقل "تفعيل باستخدام كود".
2. استعلام Firestore: `where('code', '==', code)`, `where('isValid', '==', true)`.
3. إذا وجد الكود:
   - تمديد حساب المستخدم بمقدار `durationDays`.
   - تعديل الكود: `isValid: false`, `usedBy: user.email`, `usedAt: serverTimestamp()`.

---

## 4. قواعد الحماية الصارمة (Firestore Security Rules)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuth() { return request.auth != null; }
    function uid() { return request.auth.uid; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(uid())).data; }
    function isAdmin() { return isAuth() && getUserData().role == 'admin'; }

    // Users Collection
    match /users/{userId} {
      allow read: if isAuth() && (uid() == userId || isAdmin());
      allow create: if isAuth() && uid() == userId && request.resource.data.role == 'user';
      // User can ONLY update their own subscriptionEndDate via code activation
      allow update: if isAdmin() || (
        isAuth() && uid() == userId &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['subscriptionEndDate'])
      );
      allow delete: if isAdmin();
    }

    // Payment Requests Collection
    match /payment_requests/{reqId} {
      allow read: if isAuth() && (resource.data.userId == uid() || isAdmin());
      allow create: if isAuth() && request.resource.data.userId == uid() && request.resource.data.status == 'pending';
      // User can only update status to 'archived' to dismiss rejection notice
      allow update: if isAdmin() || (
        isAuth() && resource.data.userId == uid() &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']) &&
        request.resource.data.status == 'archived'
      );
      allow delete: if isAdmin();
    }

    // Activation Codes Collection
    match /activation_codes/{codeId} {
      allow read: if isAuth();
      allow create: if isAdmin();
      // User can only mark code as used (isValid: false)
      allow update: if isAuth() &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isValid', 'usedBy', 'usedAt']) &&
        request.resource.data.isValid == false;
      allow delete: if isAdmin();
    }

    // Affiliates Collection
    match /affiliates/{affId} {
      allow read, write: if isAdmin();
    }

    // Settings Collection
    match /settings/{docId} {
      allow read: if true; // Public read for trial & banner config
      allow write: if isAdmin();
    }
  }
}
```

---

## 5. واجهات المستخدم وتجربة الاستخدام (UI/UX Guidelines)

1. **الملف الشخصي (`Profile.jsx`):**
   - **نظام التبويبات (Tabs):** يمكن للمستخدم التنقل بين "دفع وتجديد الاشتراك" أو "لدي كود تفعيل فوري (VIP)" لتجنب التشتت.
   - **الجانب الأيمن (الدفع):** إدخال كود الخصم + بطاقات الباقات الملونة (أزرق، أخضر، برتقالي).
   - **الجانب الأيسر (التحويل):** رقم فودافون كاش (ينسخ بنقرة واحدة) + حقل رقم المحفظة + رفع الإيصال (اختياري) + زر تأكيد التحويل. تختفي الحقول بذكاء عند تطبيق خصم 100%.
   - **الأسفل:** بطاقة تغيير كلمة المرور.

2. **لوحة الإدارة (`AdminDashboard.jsx`):**
   - تبويب **الطلبات المعلقة:** عرض الإيصال مع إمكانية تكبيره، زر موافقة بأيام مخصصة، وزر رفض بملاحظة.
   - تبويب **سجل المعاملات:** جدول العمليات المقبولة السابقة مع زر حذف نهائي.
   - تبويب **الأكواد:** توليد كميات مجمعة، نسخ الأكواد الصالحة، وعرض الأكواد المستهلكة مع زر تنظيف بنقرة واحدة.
   - تبويب **المسوقين:** إنشاء مسوقين جدد، متابعة الأرباح المعلقة والمكتملة، ودفع العمولات.
   - تبويب **الإعدادات:** تعديل أيام الفترة التجريبية، باقات الاشتراك، وإعدادات كود الخصم والبانر الإعلاني.
