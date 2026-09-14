import DataTable from '../../components/DataTable/DataTable'
import ComingSoon from '../../../../components/ui/ComingSoon/ComingSoon'

/* عرض ستون‌ها از SVG (از راست): 226 | 242 | 285 | 267  از ۱۰۲۰ */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '22.16%' },
    { key: 'date', label: 'تاریخ', width: '23.73%', ltr: true },
    { key: 'plan', label: 'پلن', width: '27.94%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '26.18%' },
]

/**
 * مدیریت سرویس.
 *
 * ⚠️ **این صفحه اندپوینتِ نداشته ندارد — تکراری است.**
 *
 * چهار ستونش (ردیف/تاریخ/پلن/وضعیت) عیناً همان ستون‌های
 * `OrderListPage` است که به `GET /orders/` وصل است و کار می‌کند.
 * یعنی «سرویس» در این فیگما همان «سفارش» است، نه یک موجودیت جدا؛
 * در فلو هم (`flow.dot` و `portal.dot`) چنین چیزی نیست.
 *
 * ⚠️ و این صفحه‌ی **پیش‌فرض داشبورد** است، یعنی اولین چیزی که کاربر
 * بعد از ورود می‌بیند — که الان تار است.
 *
 * تصمیم لازم (سؤالش به کارفرما رفت):
 *   الف) این صفحه حذف و `/dashboard` به فهرست سفارش‌ها ریدایرکت شود
 *   ب) اگر «سرویس» چیزی جدا از سفارش است، تعریفش را بگیریم و
 *      اندپوینتش را از بک‌اند بخواهیم
 *
 * تا آن‌موقع پوشش می‌ماند، ولی متنش می‌گوید کاربر کجا برود.
 */
export default function ServicesPage() {
    return (
        <ComingSoon note="سفارش‌ها و سرویس‌های فعال شما در «خرید ← سفارش‌های من» فهرست شده‌اند.">
            <DataTable columns={COLUMNS} rows={[]} page={1} pageCount={1} />
        </ComingSoon>
    )
}
