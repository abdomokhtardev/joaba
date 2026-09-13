# نظام الدعم الفني والاستفسارات (Support & Ticketing System) 💬

هذا المستند يوضح الهيكلة والمواصفات لنظام الشكاوى، المقترحات، والاستفسارات داخل التطبيق. 

---

## 1. المعمارية وسير العمل (Architecture & Workflow)

نظام الدعم الفني هو نظام ثنائي الاتجاه بين المستخدم (User) والإدارة (Admin).

1. **الإنشاء (User):** يقوم المستخدم بفتح نافذة الدعم وإرسال تذكرة (استفسار / مشكلة / اقتراح).
2. **المراجعة (Admin):** تظهر التذكرة في لوحة تحكم الإدارة تحت تبويب "الاستفسارات".
3. **الرد (Admin):** يقوم الإدمن بإرسال الرد، ليتم تحديث التذكرة في قاعدة البيانات.
4. **الإشعار (User):** يظهر تنبيه للمستخدم في قائمته الجانبية عند وجود رد غير مقروء (`hasUnreadReplies`).
5. **الاطلاع والحذف (User):** يقرأ المستخدم الرد، ويتغير حالة التذكرة. يمكن للمستخدم حذف التذكرة بعد قراءتها لتوفير المساحة.
6. **الحذف الإداري (Admin):** يمكن للإدمن حذف التذكرة مباشرة في أي وقت.

---

## 2. هيكل البيانات في Firestore (Database Schema)

### مجموعة التذاكر: `support_tickets/{ticketId}`
```json
{
  "userId": "firebase_auth_uid",
  "userEmail": "user@example.com",
  "type": "suggestion", // "suggestion" | "complaint" | "inquiry"
  "subject": "عنوان المشكلة أو الاقتراح",
  "message": "تفاصيل الرسالة (بحد أقصى 5000 حرف)",
  "status": "pending", // "pending" | "replied"
  "adminReply": "رد الإدارة (إن وجد)",
  "userSeen": false, // يتغير إلى true عندما يفتح المستخدم التذكرة بعد الرد
  "createdAt": "Timestamp"
}
```

---

## 3. قواعد الأمان في فايربيز (Firestore Rules)

لضمان الأمان وعدم الاستغلال، تم تحديد قواعد أمان خاصة:
- **القراءة (`read`):** المستخدم يمكنه قراءة رسائله فقط. الأدمن يمكنه قراءة كل الرسائل.
- **الإنشاء (`create`):** يتطلب أن يكون حجم الرسالة أقل من 5000 حرف (لمنع النصوص المزعجة والسبام).
- **التعديل (`update`):** الأدمن فقط من يمكنه إضافة الرد `adminReply`. المستخدم يمكنه تعديل الحقل `userSeen` فقط عندما يقرأ الرد.
- **الحذف (`delete`):** مسموح للمستخدم حذف رسائله لتنظيف السجل. مسموح للأدمن الحذف أيضاً.

```javascript
    match /support_tickets/{ticketId} {
      allow read: if isAuth() && (resource.data.userId == uid() || isAdmin());
      allow create: if isAuth() && request.resource.data.userId == uid()
        && isValidString(request.resource.data.message, 5000);
      allow update: if isAdmin()
        || (isAuth() && resource.data.userId == uid()
            && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['userSeen']));
      allow delete: if isAdmin() || (isAuth() && resource.data.userId == uid());
    }
```

---

## 4. المكونات البرمجية ذات الصلة (React Components)

- `SupportModal.jsx`: المكون المسؤول عن واجهة المستخدم (إرسال الاستفسار، وعرض السجل والردود).
- `SupportTab.jsx` (في `admin/`): واجهة الإدارة التي تعرض جميع الاستفسارات، وتسمح بكتابة الردود.
- `Layout.jsx` & `Profile.jsx`: تحتوي على زر استدعاء نافذة الدعم، مع عرض شارة حمراء (Notification Badge) عند وجود رد جديد.
