# CampusHub

### بوابة الاتصال المؤسسي — جامعة المعرفة  
**Corporate Communications Portal — Almaarefa University**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#الترخيص--license)

منصة ويب موحّدة لإدارة خدمات العلاقات العامة والتسويق، وحجز المسرح الجامعي والمرافق، ومتابعة الطلبات — بهوية بصرية مستوحاة من جامعة المعرفة، مع دعم كامل للغة العربية (RTL) والإنجليزية.

---

## نظرة عامة | Overview

| | العربية | English |
|---|---|---|
| **الاسم** | بوابة الاتصال المؤسسي | Corporate Communications Portal |
| **الجهة** | إدارة العلاقات العامة والتسويق — جامعة المعرفة | PR & Marketing — Almaarefa University |
| **المستخدمون** | منسوبو الجامعة، جهات خارجية، فريق الإدارة | University staff, external partners, admins |
| **اللغات** | العربية (افتراضي) + الإنجليزية | Arabic (default) + English |

CampusHub يوفّر مسارًا رقميًا كاملاً من تقديم الطلب حتى الإنجاز: اختيار الخدمة، تعبئة النموذج، الحصول على رقم تتبع، ومراجعة الإدارة للحالة.

---

## المميزات | Features

### للعموم (بدون تسجيل)
- **صفحة هبوط** مع سلايدر بطابع 3D وصور الحرم
- **طلب الخدمات**: حجز المرافق، تغطية إعلامية، تصوير، تصميم، سوشيال ميديا، ترجمة، فعاليات، وفود، أخبار، ورش، وغيرها
- **حجز المسرح والمرافق** (المسرح / البهو / قاعة B2) مع جدول إتاحة لـ 14 يومًا
- **تتبع الطلب** برقم تتبع فوري (مثال: `UM-26-xxxxxx`)
- **جهات داخلية وخارجية** مع كليات وأقسام جاهزة

### للإدارة (تسجيل دخول)
- **لوحة تحكم** بإحصاءات حية
- **إدارة الطلبات**: موافقة / رفض / بدء التنفيذ / إكمال مع سجل حالات
- **جدول حجوزات المرافق**
- **إعدادات النظام**: تفعيل الخدمات، الكليات والأقسام، الجهات الخارجية

### تجربة المستخدم
- واجهة **RTL-first** رسمية بهوية الجامعة (فيروزي `#00ADCA` + ذهبي `#B8956C` + كحلي `#0B2C35`)
- خط عربي رسمي: **IBM Plex Sans Arabic** + **Noto Naskh Arabic**
- تصميم متجاوب للجوال والحاسب
- تخزين محلي (localStorage) للتجربة بدون خادم خلفي

---

## لقطات المسارات | Routes

| المسار | الوصف |
|--------|--------|
| `/` | الصفحة الرئيسية |
| `/services` | كتالوج الخدمات وتقديم الطلب |
| `/venues` | المرافق وجدول الإتاحة |
| `/track` | تتبع الطلب برقم التتبع |
| `/login` | دخول الإدارة |
| `/dashboard` | لوحة التحكم (محمية) |

---

## التقنيات | Tech Stack

- **React 18** + **TypeScript**
- **Vite 5**
- **React Router 6**
- **Tailwind CSS 3**
- **Lucide React** (أيقونات)
- تخزين الحالة والبيانات عبر **Context API** + **localStorage**

---

## التشغيل السريع | Getting Started

### المتطلبات
- Node.js 18+ 
- npm (أو pnpm / yarn)

### التثبيت والتشغيل

```bash
# استنساخ المشروع
git clone https://github.com/h-abar/CampusHub.git
cd CampusHub

# تثبيت الاعتماديات
npm install

# تشغيل بيئة التطوير
npm run dev
```

ثم افتح: [http://localhost:5173](http://localhost:5173)

### أوامر أخرى

```bash
npm run build    # بناء للإنتاج → مجلد dist/
npm run preview  # معاينة البناء
npm run lint     # فحص ESLint
```

---

## بيانات الدخول التجريبية | Demo Login

| الحقل | القيمة |
|--------|--------|
| اسم المستخدم | `admin` |
| كلمة المرور | `password123` |

> للحسابات التجريبية فقط. لا تُستخدم في بيئة إنتاج حقيقية.

---

## هيكل المشروع | Project Structure

```
CampusHub/
├── public/
│   └── img/                 # صور الحرم، الشعارات، بطاقات الخدمات
├── src/
│   ├── components/          # مكوّنات واجهة (Header, HeroSlider, Forms, …)
│   ├── context/             # Auth + Language
│   ├── data/                # إعدادات افتراضية وبيانات تجريبية
│   ├── locales/             # ترجمات ar / en
│   ├── pages/               # الصفحات (Landing, Services, Venues, Track, Dashboard)
│   ├── styles/              # دعم RTL
│   ├── types/               # تعريفات TypeScript
│   └── utils/               # تخزين، مصادقة، تواريخ
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## الخدمات المدعومة | Supported Services

| المفتاح | الخدمة |
|---------|--------|
| `theater` | حجز المسرح والمرافق |
| `coverage` | تغطية إعلامية |
| `photography` | تصوير فوتوغرافي / فيديو |
| `design` | تصميم جرافيكي |
| `social` | تواصل اجتماعي |
| `translation` | ترجمة |
| `event` | تنظيم فعاليات |
| `delegation` | استقبال وفود |
| `news` | أخبار / نشرات |
| `workshop` | ورش عمل |
| `other` | خدمات أخرى |

يمكن تفعيل/تعطيل الخدمات من لوحة الإعدادات.

---

## الهوية البصرية | Brand

| العنصر | القيمة |
|--------|--------|
| الأساسي | `#00ADCA` (فيروزي الجامعة) |
| الذهبي | `#B8956C` |
| الكحلي | `#0B2C35` |
| الخط | IBM Plex Sans Arabic / Noto Naskh Arabic |
| الاتجاه | RTL افتراضيًا |

---

## ملاحظات مهمة | Notes

- البيانات حاليًا **محلية في المتصفح** (`localStorage`) لأغراض العرض والنماذج الأولية.
- للإنتاج يُفضّل ربط **API خلفي** ومصادقة آمنة وإشعارات بريدية.
- إن ظهرت بيانات قديمة، امسح `localStorage` للموقع أو استخدم نافذة خاصة.

---

## المساهمة | Contributing

1. اعمل Fork للمستودع  
2. أنشئ فرعًا للميزة: `git checkout -b feature/your-feature`  
3. نفّذ التعديلات ثم Commit  
4. ارفع الفرع وافتح Pull Request  

---

## الترخيص | License

هذا المشروع مفتوح المصدر لأغراض تعليمية ومؤسسية.  
يمكنك استخدامه وتعديله مع ذكر الجهة الأصلية عند الإمكان.

---

## التواصل | Contact

- **الجامعة:** [جامعة المعرفة — um.edu.sa](https://um.edu.sa)
- **المستودع:** [github.com/h-abar/CampusHub](https://github.com/h-abar/CampusHub)
- **العلاقات العامة (نموذجي):** pr@um.edu.sa · 920011909

---

<div align="center">

**CampusHub** · جامعة المعرفة  
Made for institutional communications & campus facilities

</div>
