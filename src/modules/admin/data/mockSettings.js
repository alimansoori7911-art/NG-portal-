/* داده‌ی نمایشی ابزارها و تنظیمات سیستم — مقادیر عیناً از فیگما.
   TODO: با اتصال به بک‌اند حذف شود.

   ⚠️ تب نوتیفیکیشن به بک‌اند وصل شد؛ این دو هنوز اندپوینت ندارند:
   اعلان‌های سیستمی و ریلیز نوت‌ها.
   رجوع به BACKEND_NEEDS.md */

/* اعلان‌های سیستمی — سه نوع با رنگ‌های فیگما:
   info آبی #7AB0FF | error قرمز #F44336 | warning نارنجی #FF9800 */
const ALERT_SAMPLE =
    'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان'

const ALERT_TYPES = [
    { type: 'info', title: 'پیام اخطار' },
    { type: 'error', title: 'عملیات ناموفق' },
    { type: 'warning', title: 'پیام هشدار' },
    { type: 'error', title: 'عملیات ناموفق' },
    { type: 'error', title: 'عملیات ناموفق' },
    { type: 'info', title: 'پیام اخطار' },
    { type: 'warning', title: 'پیام هشدار' },
]

export const MOCK_SYSTEM_ALERTS = ALERT_TYPES.map((a, i) => ({
    id: i + 1,
    ...a,
    message: ALERT_SAMPLE,
    date: '1405/4/21',
    time: '21:41:10',
}))

/* ریلیز نوت‌ها — وضعیت: منتشر شده / عدم انتشار */
export const MOCK_RELEASE_NOTES = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    title: 'نسخه جدید از راه رسید',
    status: i === 0 ? 'منتشر شده' : 'عدم انتشار',
    publishedAt: '-',
}))
