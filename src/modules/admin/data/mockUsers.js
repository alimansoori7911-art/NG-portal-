/* داده‌ی نمایشی سه جدول پایینِ «پروفایل جامع کاربر» — مقادیر از فیگما.

   لیست کاربران و لاگ ممیزی از اینجا حذف شدند چون به بک‌اند وصل شدند
   (`/admin/auth/users` و `/audit/`).

   ⚠️ این سه تا مانده‌اند چون اندپوینت «به تفکیک کاربر» ندارند:
     - سفارش‌ها: `GET /admin/orders/` فیلتر user_id ندارد
     - لایسنس‌ها: کل ماژول وجود ندارد
     - تیکت‌ها: `GET /ticketing/tickets` فیلتر user_id ندارد
   TODO: با آمدن فیلتر یا اندپوینت، حذف شوند. رجوع به BACKEND_NEEDS.md */

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
