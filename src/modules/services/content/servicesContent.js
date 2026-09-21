/**
 * محتوای صفحه‌ی خدمات.
 *
 * جدا از کامپوننت نگه داشته شده چون متن بازاریابی است و بدون دست‌زدن
 * به JSX عوض می‌شود. اگر روزی از بک‌اند آمد، فقط منبع همین فایل
 * جایگزین می‌شود.
 *
 * آیکون‌ها به‌صورت **کامپوننت** ذخیره می‌شوند نه رشته، تا اگر نامی
 * اشتباه بود همان موقع خطا بدهد نه در زمان اجرا.
 */
import {
    Settings,
    Layers,
    Network,
    ShieldCheck,
    SlidersHorizontal,
    BarChart3,
    Database,
    RefreshCw,
    Headphones,
    ScanSearch,
    ClipboardList,
    Server,
    ShieldHalf,
    Target,
    Wrench,
    TrendingUp,
    Users,
    ShieldAlert,
    Building2,
} from 'lucide-react'

/* نُه خدمت اصلی — ترتیب طبق چرخه‌ی عملیاتی، نه الفبا. */
export const SERVICES = [
    {
        id: 'consulting',
        icon: Settings,
        title: 'مشاوره و ارزیابی اولیه',
        description:
            'بررسی زیرساخت، شناسایی نیازها و ارائه نقشه راه متناسب با محیط شما.',
    },
    {
        id: 'deployment',
        icon: Layers,
        title: 'نصب و راه‌اندازی',
        description:
            'استقرار حرفه‌ای NGCorion و پیکربندی متناسب با زیرساخت شما.',
    },
    {
        id: 'onboarding',
        icon: Network,
        title: 'افزودن دارایی‌ها',
        description:
            'اتصال و آماده‌سازی دارایی‌های سازمان برای مدیریت و ارزیابی امنیتی.',
    },
    {
        id: 'assessment',
        icon: ShieldCheck,
        title: 'ارزیابی امنیتی',
        description:
            'ارزیابی وضعیت پیکربندی و کنترل‌های امنیتی بر اساس استانداردهای معتبر.',
    },
    {
        id: 'hardening',
        icon: SlidersHorizontal,
        title: 'سخت‌سازی امنیتی',
        description:
            'برنامه‌ریزی و اجرای کنترل‌شده اقدامات اصلاحی و Hardening.',
    },
    {
        id: 'risk',
        icon: BarChart3,
        title: 'تحلیل ریسک و مواجهه',
        description: 'اولویت‌بندی یافته‌ها بر اساس اهمیت دارایی و ریسک.',
    },
    {
        id: 'backup',
        icon: Database,
        title: 'مدیریت پشتیبان پیکربندی',
        description: 'راه‌اندازی و مدیریت فرایند Configuration Backup.',
    },
    {
        id: 'upgrade',
        icon: RefreshCw,
        title: 'به‌روزرسانی و ارتقا',
        description: 'Upgrade امن و کنترل‌شده به نسخه‌های جدید.',
    },
    {
        id: 'support',
        icon: Headphones,
        title: 'پشتیبانی فنی',
        description:
            'پاسخ‌گویی به مشکلات، راهنمایی فنی و همراهی در طول بهره‌برداری.',
    },
]

/* چرخه‌ی خدمات — هشت مرحله‌ی پیوسته.

   اسپک هشدار داده بود جهت فلش‌ها در تصویر ناسازگار است. اینجا یک
   ترتیب خطیِ ساده نگه داشته شده (۱ تا ۸) و چیدمان دو-ردیفه را خود
   CSS می‌سازد، پس جهت هیچ‌وقت با محتوا در تضاد نمی‌افتد. */
export const LIFECYCLE = [
    { id: 'assess', icon: ScanSearch, title: 'ارزیابی', subtitle: 'شناخت محیط و نیازها' },
    { id: 'deploy', icon: ClipboardList, title: 'استقرار', subtitle: 'نصب و پیکربندی' },
    { id: 'onboard', icon: Server, title: 'افزودن دارایی‌ها', subtitle: 'آماده‌سازی و اتصال' },
    { id: 'audit', icon: ShieldHalf, title: 'ارزیابی امنیتی', subtitle: 'Audit و Assessment' },
    { id: 'prioritize', icon: Target, title: 'اولویت‌بندی', subtitle: 'براساس ریسک' },
    { id: 'harden', icon: Wrench, title: 'سخت‌سازی', subtitle: 'اقدامات اصلاحی' },
    { id: 'protect', icon: ShieldCheck, title: 'حفاظت', subtitle: 'مدیریت پشتیبان' },
    { id: 'improve', icon: TrendingUp, title: 'بهبود مستمر', subtitle: 'پشتیبانی و نگهداری' },
]

/* چرا خدمات ما */
export const ADVANTAGES = [
    {
        id: 'integrated',
        icon: Layers,
        title: 'رویکرد یکپارچه',
        description: 'از مشاوره تا بهبود مستمر',
    },
    {
        id: 'expertise',
        icon: Users,
        title: 'تجربه و تخصص',
        description: 'تیم متخصص با تجربه عملی',
    },
    {
        id: 'risk-control',
        icon: ShieldAlert,
        title: 'کنترل و کاهش ریسک',
        description: 'رویکرد ساختاریافته و قابل اعتماد',
    },
    {
        id: 'enterprise',
        icon: Building2,
        title: 'مناسب سازمان‌های بزرگ',
        description: 'طراحی شده برای محیط‌های Enterprise',
    },
]
