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
 * مدیریت سرویس — هنوز اندپوینتی ندارد.
 *
 * ⚠️ این صفحه در **هیچ‌کدام** از دو فایل فلو نیست؛ نه در `flow.dot`
 * و نه در `portal.dot`. یعنی یا فلو ناقص است یا این صفحه اضافه —
 * سؤالی که هنوز از کارفرما جواب نگرفته‌ایم.
 *
 * جدول عمداً **خالی** رندر می‌شود نه با داده‌ی نمونه: پوشش «به‌زودی»
 * فقط تار می‌کند و متن همچنان در DOM می‌ماند، پس داده‌ی جعلی زیرش
 * ممکن بود در دمو واقعی به نظر برسد.
 */
export default function ServicesPage() {
    return (
        <ComingSoon note="این بخش هنوز در دست ساخت است.">
            <DataTable columns={COLUMNS} rows={[]} page={1} pageCount={1} />
        </ComingSoon>
    )
}
