/**
 * نام آیکون (رشته‌ی CMS) ← کامپوننت آیکون.
 *
 * طبق CMS_CONTRACT.md بند ۵.۱ فیلد `icon` اسم است نه فایل، تا آیکون
 * برداری بماند و با تم هم‌رنگ شود. اینجا آن اسم به کامپوننت تبدیل
 * می‌شود.
 *
 * نام‌ها پیش از جستجو یکدست می‌شوند (حروف کوچک، بدون `-`/`_`/فاصله)،
 * پس `badge-check`، `badge_check` و `BadgeCheck` همه یکی‌اند.
 *
 * ⚠️ اسم ناشناخته صفحه را نمی‌شکند: `resolveIcon` مقدار پیش‌فرض را
 * برمی‌گرداند (معمولاً آیکون همان ردیف در متن پیش‌فرض).
 */
import {
    BadgeCheck,
    BarChart3,
    BookOpen,
    Briefcase,
    Building2,
    ClipboardList,
    CloudDownload,
    Database,
    FileText,
    Handshake,
    Headphones,
    Layers,
    LifeBuoy,
    Mail,
    MapPin,
    Network,
    Phone,
    RefreshCw,
    Rocket,
    ScanSearch,
    Server,
    Settings,
    ShieldAlert,
    ShieldCheck,
    ShieldHalf,
    SlidersHorizontal,
    Target,
    TrendingUp,
    Users,
    Wrench,
} from 'lucide-react'
import InstagramIcon from '../components/ui/icons/InstagramIcon'

const normalize = (name) =>
    String(name ?? '')
        .toLowerCase()
        .replace(/[\s_-]+/g, '')

/* نام اصلی = نام lucide به حروف کوچک؛ چند نام کوتاه/مستعار هم
   هست چون قرارداد (`support`, `sales`) و seed بک‌اند همین‌ها را
   به کار برده‌اند. */
const ICONS = {
    badgecheck: BadgeCheck,
    badge: BadgeCheck,
    barchart3: BarChart3,
    barchart: BarChart3,
    chart: BarChart3,
    bookopen: BookOpen,
    book: BookOpen,
    briefcase: Briefcase,
    sales: Briefcase,
    building2: Building2,
    building: Building2,
    enterprise: Building2,
    clipboardlist: ClipboardList,
    clipboard: ClipboardList,
    clouddownload: CloudDownload,
    download: CloudDownload,
    database: Database,
    backup: Database,
    filetext: FileText,
    file: FileText,
    docs: FileText,
    handshake: Handshake,
    headphones: Headphones,
    layers: Layers,
    lifebuoy: LifeBuoy,
    support: LifeBuoy,
    mail: Mail,
    email: Mail,
    mappin: MapPin,
    address: MapPin,
    location: MapPin,
    network: Network,
    phone: Phone,
    refreshcw: RefreshCw,
    refresh: RefreshCw,
    rocket: Rocket,
    scansearch: ScanSearch,
    search: ScanSearch,
    server: Server,
    settings: Settings,
    shieldalert: ShieldAlert,
    shieldcheck: ShieldCheck,
    shield: ShieldCheck,
    shieldhalf: ShieldHalf,
    slidershorizontal: SlidersHorizontal,
    sliders: SlidersHorizontal,
    target: Target,
    trendingup: TrendingUp,
    users: Users,
    team: Users,
    wrench: Wrench,
    instagram: InstagramIcon,
}

/* آیکون‌هایی که انتخابگر پنل ادمین پیشنهاد می‌دهد — نام اصلی هر
   آیکون (همان چیزی که در CMS ذخیره می‌شود) و توضیح فارسی‌اش.
   نام‌های مستعار بالا فقط برای خواندن مقدارهای قدیمی‌اند. */
export const ICON_CHOICES = [
    { name: 'users', label: 'تیم / کاربران', Icon: Users },
    { name: 'badge-check', label: 'تأییدشده', Icon: BadgeCheck },
    { name: 'handshake', label: 'همکاری', Icon: Handshake },
    { name: 'settings', label: 'تنظیمات', Icon: Settings },
    { name: 'layers', label: 'لایه‌ها', Icon: Layers },
    { name: 'network', label: 'شبکه', Icon: Network },
    { name: 'shield-check', label: 'امنیت', Icon: ShieldCheck },
    { name: 'shield-half', label: 'سپر', Icon: ShieldHalf },
    { name: 'shield-alert', label: 'هشدار امنیتی', Icon: ShieldAlert },
    { name: 'sliders-horizontal', label: 'پیکربندی', Icon: SlidersHorizontal },
    { name: 'bar-chart-3', label: 'نمودار', Icon: BarChart3 },
    { name: 'trending-up', label: 'رشد', Icon: TrendingUp },
    { name: 'target', label: 'هدف', Icon: Target },
    { name: 'database', label: 'پشتیبان / داده', Icon: Database },
    { name: 'server', label: 'سرور', Icon: Server },
    { name: 'refresh-cw', label: 'به‌روزرسانی', Icon: RefreshCw },
    { name: 'wrench', label: 'ابزار', Icon: Wrench },
    { name: 'scan-search', label: 'بررسی', Icon: ScanSearch },
    { name: 'clipboard-list', label: 'چک‌لیست', Icon: ClipboardList },
    { name: 'headphones', label: 'پشتیبانی تلفنی', Icon: Headphones },
    { name: 'building-2', label: 'سازمان', Icon: Building2 },
    { name: 'file-text', label: 'سند', Icon: FileText },
    { name: 'book-open', label: 'کتاب / راهنما', Icon: BookOpen },
    { name: 'rocket', label: 'شروع', Icon: Rocket },
    { name: 'cloud-download', label: 'دانلود', Icon: CloudDownload },
    { name: 'phone', label: 'تلفن', Icon: Phone },
    { name: 'mail', label: 'ایمیل', Icon: Mail },
    { name: 'life-buoy', label: 'پشتیبانی', Icon: LifeBuoy },
    { name: 'briefcase', label: 'فروش', Icon: Briefcase },
    { name: 'map-pin', label: 'آدرس', Icon: MapPin },
    { name: 'instagram', label: 'اینستاگرام', Icon: InstagramIcon },
]

/**
 * `value` اگر رشته باشد اسم آیکون است؛ اگر از قبل کامپوننت باشد
 * (متن پیش‌فرضِ داخل کد) همان برگردانده می‌شود.
 */
export function resolveIcon(value, fallback = null) {
    if (value == null || value === '') return fallback
    if (typeof value === 'string') return ICONS[normalize(value)] ?? fallback
    return value
}
