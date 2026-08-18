/* آیتم‌های منوی داشبورد سازمانی — ترتیب و برچسب‌ها از فیگما.

   «وضعیت پشتیبانی» حذف شد چون در فیگما وجود ندارد، و «حسابداری»
   طبق فیگما به «فاکتور» تغییر نام داد. */
export const ORG_MENU_ITEMS = [
    { id: 'services', label: 'مدیریت سرویس', path: '/dashboard/services' },
    { id: 'tickets', label: 'مدیریت تیکت', path: '/dashboard/tickets' },
    { id: 'notifications', label: 'اعلان ها', path: '/dashboard/notifications' },
    { id: 'invoices', label: 'فاکتور', path: '/dashboard/invoices' },
    { id: 'logs', label: 'مدیریت LOG', path: '/dashboard/logs' },
    { id: 'sessions', label: 'مدیریت نشست ها', path: '/dashboard/sessions' },
]