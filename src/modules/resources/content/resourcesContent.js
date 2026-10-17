/**
 * محتوای «مرکز منابع».
 *
 * ⚠️ نکته‌ی مهم درباره‌ی این صفحه:
 *
 * اسپک دیزاین برای هر دسته یک لینک داشت («مشاهده مستندات»، «مشاهده
 * نسخه‌ها» و …) و قبلاً هیچ‌کدام مقصد واقعی نداشتند، پس برچسب
 * «به‌زودی» می‌گرفتند.
 *
 * حالا همه مقصد دارند: `GET /cms/pages` پارامتر `tag` دارد و
 * صفحه‌ی مقالات فیلتر برچسب را از قبل پشتیبانی می‌کند، پس هر دسته
 * به `/resources/articles?tag=…` می‌رود. برچسب‌ها در CMS مدیریت
 * می‌شوند، پس افزودن مقاله به یک دسته کار محتواست نه کد.
 *
 * اگر دسته‌ای هنوز مقاله‌ای نداشته باشد، صفحه‌ی مقالات پیام
 * «مقاله‌ای یافت نشد» می‌دهد نه خطا — همان چیزی که می‌خواهیم،
 * چون دسته واقعی است و فقط هنوز خالی است.
 *
 * `ready: false` هنوز پشتیبانی می‌شود برای دسته‌های بعدی.
 */
import {
    FileText,
    Rocket,
    BookOpen,
    ShieldCheck,
    RefreshCw,
    CloudDownload,
} from 'lucide-react'

/* دسته‌بندی منابع — شش کارت اصلی */
export const CATEGORIES = [
    {
        id: 'docs',
        icon: FileText,
        title: 'مستندات',
        description: 'راهنمای جامع استفاده، پیکربندی و مدیریت NGCorion.',
        linkLabel: 'مشاهده مستندات',
        ready: true,
        to: '/resources/articles?tag=مستندات',
    },
    {
        id: 'getting-started',
        icon: Rocket,
        title: 'شروع کار',
        description: 'راهنمای گام‌به‌گام برای شروع سریع و آسان.',
        linkLabel: 'مشاهده راهنما',
        ready: true,
        to: '/resources/articles?tag=شروع-کار',
    },
    {
        id: 'knowledge-base',
        icon: BookOpen,
        title: 'پایگاه دانش',
        description: 'پاسخ‌ها و راهکارهای عملی به سوالات متداول.',
        linkLabel: 'مشاهده مقالات',
        /* تنها دسته‌ای که مقصد واقعی دارد: مقاله‌های منتشرشده‌ی CMS.
           بقیه هنوز نه صفحه‌ای دارند نه منبعی. */
        ready: true,
        to: '/resources/articles',
    },
    {
        id: 'security',
        icon: ShieldCheck,
        title: 'امنیت و انطباق',
        description: 'منابع تخصصی امنیت زیرساخت و استانداردهای معتبر.',
        linkLabel: 'مشاهده منابع',
        ready: true,
        to: '/resources/articles?tag=امنیت',
    },
    {
        id: 'releases',
        icon: RefreshCw,
        title: 'نسخه‌ها',
        description: 'اطلاع از جدیدترین نسخه‌ها و تغییرات محصول.',
        linkLabel: 'مشاهده نسخه‌ها',
        ready: true,
        to: '/resources/articles?tag=نسخه‌ها',
    },
    {
        id: 'downloads',
        icon: CloudDownload,
        title: 'دانلودها',
        description: 'فایل‌ها، بروشورها و منابع قابل دانلود NGCorion.',
        linkLabel: 'مشاهده دانلودها',
        ready: true,
        to: '/resources/articles?tag=دانلودها',
    },
]

/* پرطرفدارترین منابع — فهرست کناری.
   شکل همان آیتم `popular` در CMS است (`{ label }`). */
export const POPULAR = [
    { label: 'راهنمای نصب و راه‌اندازی' },
    { label: 'سوالات متداول (FAQ)' },
    { label: 'مستندات API' },
    { label: 'چک‌لیست پیش‌نیازها' },
    { label: 'راهنمای Hardening' },
    { label: 'لیست دارایی‌های پشتیبانی‌شده' },
]

/* موضوعات پربحث — چیپ‌های زیر جعبه‌ی جستجو.
   شکل همان آیتم `topics` در CMS است (`{ label }`). */
export const TOPICS = [
    { label: 'نصب و راه‌اندازی' },
    { label: 'امنیت' },
    { label: 'نسخه‌ها' },
    { label: 'API' },
    { label: 'پشتیبان‌گیری' },
]
