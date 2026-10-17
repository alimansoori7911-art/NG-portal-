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

/**
 * `value` اگر رشته باشد اسم آیکون است؛ اگر از قبل کامپوننت باشد
 * (متن پیش‌فرضِ داخل کد) همان برگردانده می‌شود.
 */
export function resolveIcon(value, fallback = null) {
    if (value == null || value === '') return fallback
    if (typeof value === 'string') return ICONS[normalize(value)] ?? fallback
    return value
}
