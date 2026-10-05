# ممیزی اسپک در برابر کد — چه داریم و نزده‌ایم، چه نداریم

تاریخ: ۱۴۰۵/۰۷/۱۳ · مرجع: `docs/openapi.json` (اسپک ۲۰، مو‌به‌مو برابر ۱۸)

روش: همه‌ی ۱۶۲ عملیات اسپک با مسیرهای واقعی کد تطبیق داده شد، سپس
متدهای سرویس با مصرف‌کننده‌هایشان (هوک/صفحه/کامپوننت) مقایسه شدند.

| سنجه | عدد |
|---|---|
| کل عملیات اسپک | ۱۶۲ |
| متد سرویس نوشته‌شده | ۱۸۷ |
| **متدی که واقعاً به صفحه‌ای می‌رسد** | **۱۲۳** |
| **نوشته‌شده ولی هیچ صفحه‌ای صدایش نمی‌زند** | **۶۴** |

یعنی مشکل ما «نداشتن اندپوینت» نیست — **داریم و استفاده نکرده‌ایم**.

---

# 🟡 بخش اول — داریم ولی کار نکرده‌ایم

## ۱. کاتالوگ محصول — بزرگ‌ترین شکاف (۲۵ عملیات)

صفحه‌ی `admin/catalog` فقط دو تب دارد: «محصولات و پلن‌ها» و «مدت‌های
اعتبار». یعنی **پلن و قیمت و ویژگی** مدیریت می‌شوند، ولی اینها نه:

| موضوع | عملیات بلااستفاده |
|---|---|
| **خودِ محصول** | `createProduct` · `updateProduct` · `deleteProduct` |
| **دسته‌بندی** | `createCategory` · `updateCategory` · `deleteCategory` · `getCategory` |
| **نسخه‌ی محصول** | `createProductVersion` · `updateProductVersion` · `deleteProductVersion` · `getProductVersion` |
| **ویژگی** | `createFeature` · `updateFeature` · `deleteFeature` · `getFeature` |
| **ویژگی پلن** | `addPlanFeature` · `updatePlanFeature` · `deletePlanFeature` · `getPlanFeature(s)` |
| **قیمت پلن** | `updatePlanPrice` · `deletePlanPrice` · `getPlanPrice(s)` |

⚠️ **محصول فقط از دیتابیس ساخته می‌شود.** ادمین نمی‌تواند محصول یا
دسته یا نسخه‌ی تازه بسازد — همه از قبل باید وجود داشته باشند.

## ۲. نقش و دسترسی (۱۱ عملیات)

`admin/users` دو تب دارد: «لیست کاربران» و «لاگ ممیزی». نقش فقط
**تخصیص داده می‌شود** (`assignRole`)، ولی مدیریت خودِ نقش‌ها نیست:

`createRole` · `updateRole` · `deleteRole` · `getPermissions` ·
`getRolePermissions` · `assignRolePermissions` · `assignUserPermissions` ·
`getRoleUsers` · `getAdmins` · `createUser` · `getUser`

⚠️ **ساخت نقش تازه و تعیین دسترسی‌هایش از پنل ممکن نیست** — کل
`permissions` بلااستفاده است.

## ۳. دپارتمان تیکت (۷ عملیات)

`createDepartment` · `updateDepartment` · `deleteDepartment` ·
`getDepartment` · `getDepartmentMembers` · `addDepartmentMembers` ·
`removeDepartmentMember`

تیکت به دپارتمان وصل می‌شود ولی **دپارتمان‌ها از پنل ساخته نمی‌شوند**
و عضوگیری‌شان UI ندارد.

## ۴. CMS عمومی (۵ عملیات) — تازه ساخته شد ولی نیمه‌کاره

`getPublicPages` · `getPublicPage` · `resolveRedirect` · `getRedirects` ·
`getStructuredSchemas`

⚠️ **ادمین صفحه می‌سازد و منتشر می‌کند، ولی هیچ صفحه‌ای در سایت
نمایشش نمی‌دهد.** `/terms` از فایل ثابت `legalDocs.js` می‌خواند و
`/resources` خالی است. محتوا منتشر می‌شود و دیده نمی‌شود.

## ۵. متفرقه (۱۶ عملیات)

- **فایل:** `getDownload` · `getDownloadUrl` — دانلود امن پیاده نشده
- **سفارش:** `getMyPayments` · `getOrderPayments` — تاریخچه‌ی پرداخت کاربر
- **تخفیف:** `getMyDiscounts` — کاربر کدهای تخفیف خودش را نمی‌بیند
- **اعلان:** `removeMany` (حذف گروهی) · `getTemplate` · `getNotification`
- **سلامت:** `check` · `live` — صفحه‌ی وضعیت سیستم نداریم
- **جزئیات:** `getLog` · `getInvoice` · `getLicense` · `getDiscount`

---

# 🔴 بخش دوم — نداریم و باید از بک‌اند بگیریم

این‌ها در اسپک **وجود ندارند**:

## ۱. `public_id` روی فهرست کاربران ← کوچک‌ترین و فوری‌ترین

`DiscountCreate.target_user_public_ids` شناسه‌ی UUID می‌خواهد، ولی
`GET /admin/auth/users` فقط `id` عددی می‌دهد و هیچ مسیری این دو را به
هم وصل نمی‌کند.

**نتیجه:** انتخابگر کاربر برای «کد تخفیف برای کاربران مشخص» ساخته نشد
و شناسه **دستی** گرفته می‌شود. فقط افزودن `public_id` به
`UserResponseSchema` کافی است.

## ۲. صدور فاکتور

تنها تب باقی‌مانده زیر `ComingSoon` در `admin/finance`. اندپوینت ساخت
فاکتور وجود ندارد (فقط خواندن و PDF هست).

## ۳. گزارش تجمیعی فروش

`GET /admin/reports/sales?from=&to=` → `{ total_verified, total_pending,
count, currency }`

الان کارت‌های مالی جمعِ **یک صفحه** را نشان می‌دهند، نه کل سیستم،
چون مسیر صفحه‌بندی‌شده است. برچسبش صریح گذاشته شده تا کسی آن را
«کل فروش» نخواند.

## ۴. صدور لایسنس از پرتال

فقط LS به ما خبر می‌دهد؛ مسیر معکوس نیست. چیزی مثل `POST /admin/license/`
با `customer_name`، `customer_email`، `organization_name`، `plan_type`.

⚠️ چون پاسخ LS **async** است، همان لحظه یک وضعیت «در حال صدور» برگردانید.

## ۵. فیلد اولویت تیکت

enum روی `TicketOutSchema` (مثلاً `LOW/NORMAL/HIGH/URGENT`) + فیلتر
`priority` روی هر دو مسیر لیست تیکت.

## ۶. نام نویسنده روی پیام تیکت

`author_full_name` یا `author_username` روی `TicketMessageOutSchema` —
هم در `GET .../messages` هم در پاسخ `POST .../reply`، و **برای کاربر
عادی نه فقط ادمین**. الان همه‌جا «کاربر» نوشته می‌شود.

## ۷. ارسال اعلان بدون قالب

`NotificationAdminCreate` فقط `template_key` می‌گیرد. دو فیلد اختیاری
`title` و `body` (و `sms_body`) لازم است که وقتی `template_key` نیامد
استفاده شوند.

## ۸. یک نقش به نام `vip`

فقط رکورد، نه کد. برچسب VIP از روی نقش‌ها ساخته می‌شود.

## ۹. محتوای «مرکز منابع»

`/resources` طبق دیزاین ساخته شد ولی چیزی که معرفی می‌کند وجود ندارد:
مستندات، پایگاه دانش، Release Notes و PDF.

💡 **حالا که CMS آمده، این با CMS حل می‌شود** — دیگر اندپوینت تازه
نمی‌خواهد، فقط باید `/resources` را به `GET /cms/pages` وصل کنیم.

---

# ❓ بخش سوم — سؤال‌های باز

۱. **`PUT /admin/cms/pages/{id}` آرایه‌ی `blocks` را ادغام می‌کند یا
جایگزین؟** اسپک نمی‌گوید. ما محتاطانه بلوک‌های `editable: false` را هم
بدون تغییر پس می‌فرستیم، چون در حالت جایگزین محتوایشان پاک می‌شود.

۲. **`CmsStructuredFieldSpecOut.kind` چه مقادیری می‌گیرد؟** enum ندارد.
فعلاً `text`، `textarea`، `rich_text`، `url`، `image` را می‌شناسیم و
بقیه input ساده می‌گیرند.

۳. **پاک‌سازی HTML در CMS** ← امنیتی. ویرایشگر HTML تولید می‌کند؛
sanitize کار سرور است. اگر انجام نشود راه XSS باز است.

۴. **الگوی `slug`؟** `CmsPageCreate.slug` هیچ محدودیتی ندارد. ما فقط
لاتین می‌پذیریم چون اسلاگ فارسی در نشانی درصد-کدگذاری می‌شود. اگر
بک‌اند خودش از عنوان فارسی اسلاگ می‌سازد، الگویش را بگویید.

---

# ✅ وضعیت اندپوینت‌های داخلی

این چهار مورد **عمداً** زده نشده‌اند و درست است:

`POST /internal/license/license-events` · `GET /internal/license/users` ·
`GET /internal/license/users/{user_id}` · `GET /internal/license/orders`

اینها مسیر **سرور-به-سرور** بین بک‌اند و License Server هستند، نه کار
فرانت. (`POST /dl/upload` هم آپلود مستقیم است که از مسیر توکن‌دار
فایل استفاده می‌کنیم.)
