/* داده‌ی نمایشی دو جدول پایینِ «پروفایل جامع کاربر» — مقادیر از فیگما.

   لیست کاربران، لاگ ممیزی و تاریخچه‌ی خرید از اینجا حذف شدند چون به
   بک‌اند وصل شدند (`/admin/auth/users`، `/audit/`، و
   `/admin/orders/?user_id=`).

   ⚠️ این دو مانده‌اند چون اندپوینت «به تفکیک کاربر» ندارند:
     - لایسنس‌ها: کل ماژول وجود ندارد
     - تیکت‌ها: `GET /ticketing/tickets` فقط `assigned_to_user_id`
       (کارشناس) را فیلتر می‌کند، نه صاحب تیکت
   TODO: با آمدن فیلتر یا اندپوینت، حذف شوند. رجوع به BACKEND_NEEDS.md */

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
