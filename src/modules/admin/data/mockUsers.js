/* داده‌ی نمایشی — مقادیر عیناً از فیگما گرفته شده‌اند.
   TODO: با اتصال به بک‌اند حذف شود.

   ⚠️ اندپوینت لیست کاربران هنوز در اسپک وجود ندارد — `/admin/*` فعلاً
   فقط محصولات، پلن‌ها، قیمت‌ها و دسته‌بندی دارد. رجوع به BACKEND_NEEDS.md */
/* ۲۰ ردیف تا صفحه‌ی دوم هم محتوا داشته باشد (هر صفحه ۱۰ ردیف).
   شماره‌ی ردیف پیوسته است تا موقع تعویض صفحه تفاوت دیده شود. */
export const MOCK_ADMIN_USERS = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    email: 'test@gmail.com',
    username: 'ahad12',
    phone: '09937791943',
    status: 'فعال',
    role: 'کاربر عادی',
    vip: 'غیرفعال',
    registeredAt: '1404/4/18',
}))

/* ── پروفایل جامع کاربر (tab2) ──
   TODO: هیچ‌کدام اندپوینت ندارند. رجوع به BACKEND_NEEDS.md */

/* اطلاعات شخصی — ترتیب فیلدها دقیقاً مطابق فیگما (دو ستونه).
   value خالی یعنی فیلد پر نشده و در فیگما حاشیه‌ی کم‌رنگ‌تر دارد. */
export const MOCK_USER_PROFILE = {
    username: 'sina352',
    nationalId: '',
    firstName: 'طه',
    email: 'test@gmail.com',
    lastName: '',
    password: 'hdwdjd21',
    phone: '09021105234',
    organization: '',
}

/* تاریخچه خرید و سفارشات */
export const MOCK_USER_ORDERS = Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    plan: 'test@gmail.com',
    orderCode: 'ahad12',
    date: '1404/4/18',
}))

/* لایسنس‌های فعال/منقضی */
const LICENSE_STATUS = ['غیرفعال', 'فعال', 'منقضی شده']

export const MOCK_USER_LICENSES = Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    license: '1dx92cj1k',
    status: LICENSE_STATUS[i % 3],
    expiresAt: '1406/3/11',
    activatedAt: '1405/3/11',
    server: '192.168.1.1',
}))

/* تیکت‌های کاربر */
export const MOCK_USER_TICKETS = Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    status: 'در حال پیگیری',
    date: '1404/5/21',
    department: 'فنی',
}))

/* لاگ ممیزی (Audit Log) — دو ستونه در فیگما.
   TODO: اندپوینت ندارد. */
const AUDIT_ACTIONS = ['کسر از کیف پول', 'تغییر لایسنس']

export const MOCK_AUDIT_LOGS = Array.from({ length: 28 }, (_, i) => ({
    id: i + 1,
    action: AUDIT_ACTIONS[i % 2],
    admin: 'admin-support',
    ip: '192.168.3.80',
    time: '1404/4/12 21:54:06',
}))
