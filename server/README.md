# CampusHub API — خادم بوابة الاتصال المؤسسي

خادم Express + PostgreSQL يخزّن الطلبات والحجوزات والمرافق والمشرفين والإعدادات.
الواجهة الأمامية تتصل به تلقائياً، وإن لم يكن متاحاً تعمل بوضع localStorage كاحتياط.

## التشغيل

### 1) قاعدة البيانات PostgreSQL

**الخيار الأسهل — Docker:**
```bash
docker compose up -d
```

**أو تثبيت PostgreSQL يدوياً** ثم إنشاء القاعدة:
```bash
createdb campushub
# أو: psql -U postgres -c "CREATE DATABASE campushub;"
```

### 2) الخادم

```bash
cd server
npm install
cp .env.example .env    # عدّل DATABASE_URL إن لزم
npm run dev             # http://localhost:3001
```

الجداول تُنشأ تلقائياً من `schema.sql` عند الإقلاع، والواجهة تزرع البيانات
الافتراضية (المشرفون، المرافق، الإعدادات) عبر `POST /api/bootstrap` عندما
تكون القاعدة فارغة.

## الواجهة الأمامية

الواجهة تتصل بـ `http://localhost:3001` افتراضياً. لتغييره أنشئ `.env`
في جذر المشروع:

```
VITE_API_URL=http://localhost:3001
```

## نقاط النهاية (Endpoints)

| Method | Path | الوصف |
|--------|------|-------|
| GET | /api/health | فحص الخادم |
| GET | /api/bootstrap-state | هل القاعدة فارغة؟ |
| POST | /api/bootstrap | زرع البيانات الافتراضية |
| POST | /api/auth/login | تسجيل الدخول |
| GET/POST | /api/requests | قائمة/إنشاء الطلبات |
| PATCH | /api/requests/:id | تحديث طلب (حالة، موعد، أولوية...) |
| GET/POST | /api/venues | المرافق |
| PATCH | /api/venues/:id | تحديث مرفق |
| GET/POST/PATCH/DELETE | /api/admins | المشرفون |
| GET/PUT | /api/settings | إعدادات النظام |
