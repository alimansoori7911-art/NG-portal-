/* داده‌ی نمایشی فروش و مشتریان — مقادیر عیناً از فیگما.
   TODO: با اتصال به بک‌اند حذف شود.

   ⚠️ وضعیت بک‌اند:
   • سفارش‌ها: GET /admin/orders/ وجود دارد ولی ستون‌های فیگما
     (کد سفارش، خریدار، مبلغ، وضعیت پرداخت) با OrderOutput کامل
     نمی‌خوانند و «صدور/مشاهده فاکتور» اندپوینت ندارند.
   • لایسنس‌ها: هیچ اندپوینتی وجود ندارد — نه لیست، نه ساخت،
     نه فعال‌سازی/غیرفعال‌سازی/تمدید/فسخ.
   رجوع به BACKEND_NEEDS.md */

/* ۲۰ ردیف تا صفحه‌ی دوم هم محتوا داشته باشد (هر صفحه ۱۰ ردیف) */
export const MOCK_SALES_ORDERS = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    orderCode: '492vcs1',
    buyer: 'had2-xs1',
    amount: '500 میلیون',
    paymentStatus: 'تایید شده',
    plan: 'Pro',
    date: '1404/2/08',
}))

/* وضعیت لایسنس — سه حالت در فیگما دیده می‌شود */
const LICENSE_STATUS = ['فعال', 'فعال', 'غیرفعال', 'غیرفعال', 'منقضی']
const LICENSE_USERS = ['had2-xs1', 'sina/e231']

export const MOCK_LICENSES = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    licenseCode: '492vcs1',
    user: LICENSE_USERS[i % 2],
    status: LICENSE_STATUS[i % 5],
    server: '192.168.50.201/24',
}))
