/**
 * محتوای «مرکز منابع».
 *
 * ⚠️ نکته‌ی مهم درباره‌ی این صفحه:
 *
 * اسپک دیزاین برای هر دسته یک لینک داشت («مشاهده مستندات»، «مشاهده
 * نسخه‌ها» و …) ولی **هیچ‌کدام از آن مقصدها وجود ندارند** — نه صفحه‌ای
 * در فرانت، نه اندپوینتی در اسپک بک‌اند (نسخه ۱۹). مستندات، پایگاه
 * دانش، Release Notes و فایل‌های PDF هنوز ساخته نشده‌اند.
 *
 * پس `ready` روی هر آیتم می‌گوید مقصدش آماده است یا نه. آیتم‌های
 * ناآماده به‌جای لینکِ ۴۰۴، برچسب «به‌زودی» می‌گیرند — همان قاعده‌ای که
 * هدر برای «منابع» و «خدمات» داشت.
 *
 * وقتی هر بخش ساخته شد، کافی است `to` پر و `ready: true` شود.
 */
import {
    FileText,
    Rocket,
    BookOpen,
    ShieldCheck,
    RefreshCw,
    CloudDownload,
    Clock,
    Target,
    Package,
} from 'lucide-react'

/* دسته‌بندی منابع — شش کارت اصلی */
export const CATEGORIES = [
    {
        id: 'docs',
        icon: FileText,
        title: 'مستندات',
        description: 'راهنمای جامع استفاده، پیکربندی و مدیریت NGCorion.',
        linkLabel: 'مشاهده مستندات',
        ready: false,
    },
    {
        id: 'getting-started',
        icon: Rocket,
        title: 'شروع کار',
        description: 'راهنمای گام‌به‌گام برای شروع سریع و آسان.',
        linkLabel: 'مشاهده راهنما',
        ready: false,
    },
    {
        id: 'knowledge-base',
        icon: BookOpen,
        title: 'پایگاه دانش',
        description: 'پاسخ‌ها و راهکارهای عملی به سوالات متداول.',
        linkLabel: 'مشاهده مقالات',
        ready: false,
    },
    {
        id: 'security',
        icon: ShieldCheck,
        title: 'امنیت و انطباق',
        description: 'منابع تخصصی امنیت زیرساخت و استانداردهای معتبر.',
        linkLabel: 'مشاهده منابع',
        ready: false,
    },
    {
        id: 'releases',
        icon: RefreshCw,
        title: 'نسخه‌ها',
        description: 'اطلاع از جدیدترین نسخه‌ها و تغییرات محصول.',
        linkLabel: 'مشاهده نسخه‌ها',
        ready: false,
    },
    {
        id: 'downloads',
        icon: CloudDownload,
        title: 'دانلودها',
        description: 'فایل‌ها، بروشورها و منابع قابل دانلود NGCorion.',
        linkLabel: 'مشاهده دانلودها',
        ready: false,
    },
]

/* منابع پیشنهادی — فایل‌های PDF که هنوز وجود ندارند.

   ⚠️ تعداد صفحه‌ها عمداً **حذف** شده‌اند. اسپک «PDF ۱۲ صفحه» داشت،
   ولی وقتی فایلی وجود ندارد، نوشتن تعداد صفحه‌اش ادعای دروغ است. */
export const FEATURED = [
    {
        id: 'install-guide',
        icon: FileText,
        badge: 'مستندات',
        title: 'راهنمای نصب و راه‌اندازی',
        description: 'مراحل نصب و پیکربندی اولیه NGCorion',
    },
    {
        id: 'quick-start',
        icon: Clock,
        badge: 'راهنما',
        title: 'شروع سریع',
        description: 'از نصب تا اولین ارزیابی امنیتی',
    },
    {
        id: 'hardening',
        icon: Target,
        badge: 'امنیت',
        title: 'بهترین روش‌های Hardening',
        description: 'نکات کلیدی برای ایمن‌سازی دارایی‌ها',
    },
    {
        id: 'product-overview',
        icon: Package,
        badge: 'معرفی محصول',
        title: 'معرفی قابلیت‌های NGCorion',
        description: 'نمای کلی محصول و کاربردها',
    },
]

/* پرطرفدارترین منابع — فهرست کناری */
export const POPULAR = [
    'راهنمای نصب و راه‌اندازی',
    'سوالات متداول (FAQ)',
    'مستندات API',
    'چک‌لیست پیش‌نیازها',
    'راهنمای Hardening',
    'لیست دارایی‌های پشتیبانی‌شده',
]

/* موضوعات پربحث — چیپ‌های زیر جعبه‌ی جستجو */
export const TOPICS = [
    'نصب و راه‌اندازی',
    'امنیت',
    'نسخه‌ها',
    'API',
    'پشتیبان‌گیری',
]
