# TODO: إصلاح kawkab-app - خطة شاملة ✅

## الخطوات المطلوبة (8 خطوات)

### [ ] 1. تنظيف src/data/products.js
- إزالة الـ imports غير المستخدمة (waffel1-6)
- التحقق من روابط الصور

### [ ] 2. إنشاء kawkab-app/.env
- إضافة Firebase placeholder لتجنب الأخطاء

### [ ] 3. تعطيل Firebase مؤقتاً
- تعليق Route في App.jsx
- تعديل config.js لـ graceful fallback

### [ ] 4. إصلاح CSS في Checkout.jsx
- إضافة missing classes في index.css

### [ ] 5. تشغيل ESLint & تنظيف
```
cd kawkab-app && npm run lint -- --fix
```

### [ ] 6. اختبار npm run dev
- فتح http://localhost:5173
- اختبار الـ Flow: Home → Menu → Cart → Checkout

### [ ] 7. Runtime Error Check
```
cd kawkab-app && npm run dev
```
- Console tab: No errors/warnings
- Network: Images load
- Mobile: Responsive

### [ ] 8. Final Validation
- جميع الروابط تعمل
- Cart يحفظ/يحذف
- Checkout يعمل بدون أخطاء
- استخدم attempt_completion

---

**حالة الحالية**: Plan Approved ✅  
**التالي**: Step 1 → تنظيف products.js
