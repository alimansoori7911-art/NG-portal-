/* داده‌ی نمایشی لاگ‌های کاربر — مقادیر عیناً از فیگما.
   TODO: با اتصال به بک‌اند حذف شود.

   ⚠️ اندپوینتی برای لاگ‌های کاربر وجود ندارد.
   رجوع به BACKEND_NEEDS.md

   سه سطح با رنگ‌های فیگما:
     info    #7AB0FF  (آبی)
     error   #990000  (قرمز تیره)
     warning #E85D04  (نارنجی) */

const SAMPLE =
    'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ لورم ایپسوم متن ساختگی نامفهوم از صنعت چاپ'

/* ترتیب سطح‌ها دقیقاً مطابق ردیف‌های فیگما */
const LEVELS = ['info', 'error', 'info', 'warning', 'info', 'error', 'info', 'warning']
const TIMES = ['21:56:10', '21:55:34', '21:45:14', '21:45:14', '21:56:10', '21:55:34', '21:45:14', '21:45:14']

export const MOCK_LOGS = LEVELS.map((level, i) => ({
    id: i + 1,
    level,
    message: SAMPLE,
    time: TIMES[i],
}))

/* دکمه‌های فیلتر — ترتیب از راست در فیگما: Warning، Error، Info */
export const LOG_FILTERS = [
    { id: 'warning', label: 'Warning' },
    { id: 'error', label: 'Error' },
    { id: 'info', label: 'Info' },
]
