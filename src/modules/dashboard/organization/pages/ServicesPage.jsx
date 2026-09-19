import DataTable from '../../components/DataTable/DataTable'
import { useLicenses } from '../hooks/useLicenses'

/* ستون‌ها بر اساس `LicenseListOutput`.

   فیگما چهار ستون داشت (ردیف/تاریخ/پلن/وضعیت) که دقیقاً ستون‌های
   «سفارش‌های من» بود. ولی بک‌اند روشن کرد این صفحه باید بگوید کاربر
   **کدام لایسنس** را با چه مشخصاتی دارد — پس ستون‌ها از خودِ پاسخ
   گرفته شده‌اند نه از فیگما، وگرنه ستون بی‌داده می‌ماند. */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '8%' },
    { key: 'orderNumber', label: 'شماره سفارش', width: '20%', ltr: true },
    { key: 'startsAt', label: 'شروع', width: '16%', ltr: true },
    { key: 'expiresAt', label: 'انقضا', width: '16%', ltr: true },
    { key: 'limits', label: 'سقف‌ها', width: '26%' },
    { key: 'status', label: 'وضعیت', width: '14%' },
]

/**
 * مدیریت سرویس — لایسنس‌های فعال کاربر (`GET /license/`).
 *
 * ⚠️ «سرویس» در این پرتال یعنی **لایسنس**، نه سفارش. بک‌اند تأیید کرد
 * که این صفحه باید بگوید کاربر کدام لایسنس را با چه داده‌ای دارد.
 *
 * (پیش از این تار بود و ستون‌هایش تکرار «سفارش‌های من» بود. تاریخچه‌ی
 * خرید جای دیگری است: `products/buy/orders`.)
 *
 * این صفحه‌ی پیش‌فرض داشبورد است، پس اولین چیزی که کاربر بعد از ورود
 * می‌بیند همین است — و حالا داده‌ی واقعی دارد.
 */
export default function ServicesPage() {
    const { rows, page, pageCount, loading, error, setPage } = useLicenses()

    return (
        <DataTable
            columns={COLUMNS}
            rows={rows}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            emptyMessage={
                loading
                    ? 'در حال دریافت لایسنس‌ها…'
                    : error || 'هنوز لایسنسی برای شما صادر نشده است.'
            }
        />
    )
}
