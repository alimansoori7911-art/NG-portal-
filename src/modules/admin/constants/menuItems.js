import {
    UserCog,
    Headset,
    LogIn,
    Landmark,
    Archive,
    Settings,
} from 'lucide-react'

/* آیتم‌های منوی پنل ادمین — ترتیب و برچسب‌ها از SVG فیگما.
   فاصله‌ی عمودی هر آیتم در فیگما ۶۴px است.

   فقط «کاربران و دسترسی‌ها» فعلاً صفحه دارد؛ بقیه با آماده شدن
   فیگمایشان روت می‌گیرند. */
export const ADMIN_MENU_ITEMS = [
    { id: 'users', label: 'کاربران و دسترسی‌ها', path: '/admin/users', icon: UserCog },
    { id: 'support', label: 'پشتیبانی و تیکتینگ', path: '/admin/support', icon: Headset },
    { id: 'sales', label: 'فروش و مشتریان', path: '/admin/sales', icon: LogIn },
    { id: 'finance', label: 'مدیریت مالی', path: '/admin/finance', icon: Landmark },
    { id: 'catalog', label: 'محصولات و کاتالوگ', path: '/admin/catalog', icon: Archive },
    { id: 'settings', label: 'ابزارها و تنظیمات سیستم', path: '/admin/settings', icon: Settings },
]
