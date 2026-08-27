import { useState } from 'react'
import { X } from 'lucide-react'
import DataTable from '../../components/DataTable/DataTable'
import { useInvoices, INVOICES_PER_PAGE } from '../hooks/useInvoices'
import { formatJalaliDateTime } from '../../../../utils/datetime'
import styles from './InvoicesPage.module.css'

/* عرض ستون‌ها از SVG (از راست): 258 | 234.8 | 264 | 263.2  از ۱۰۲۰ */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '25.29%' },
    { key: 'date', label: 'تاریخ', width: '23.02%', ltr: true },
    { key: 'plan', label: 'پلن', width: '25.88%', ltr: true },
    { key: 'serial', label: 'شماره سریال', width: '25.81%', ltr: true },
]

/**
 * تبدیل PublicInvoiceListItemSchema به ردیف جدول.
 *
 * تاریخِ ستون «تاریخ» از `issued_at` می‌آید نه `created_at`: کاربر
 * تاریخ صدور فاکتور را می‌خواهد، نه زمان ساخته شدن رکورد. فاکتور
 * پیش‌نویس هنوز صادر نشده و تاریخش تهی است.
 */
function toRow(invoice, i, offset) {
    const { date } = formatJalaliDateTime(invoice.issued_at)

    return {
        id: invoice.id,
        index: offset + i + 1,
        date: date || '—',
        /* اسنپ‌شات‌ها ممکن است تهی باشند (اسپک همه را nullable گذاشته) */
        plan: invoice.snapshot_plan_name || '—',
        serial: invoice.invoice_number,
        /* برای کلیک روی ردیف لازم است */
        pdf_file_id: invoice.pdf_file_id,
    }
}

/**
 * فاکتورهای کاربر.
 *
 * وصل به `GET /invoice/`. کلیک روی ردیف، PDF را در تب جدید باز
 * می‌کند — لینک دانلود از `POST /dl/{file_id}` گرفته می‌شود و
 * کوتاه‌عمر است، پس هر بار تازه گرفته می‌شود.
 *
 * نوار راهنمای بالای جدول (۹۶۱×۷۳ در SVG با حاشیه‌ی #7AB0FF) به کاربر
 * می‌گوید برای دیدن PDF روی ردیف کلیک کند و با ضربدر بسته می‌شود.
 */
export default function InvoicesPage() {
    const [hintOpen, setHintOpen] = useState(true)

    const {
        invoices,
        page,
        pageCount,
        loading,
        error,
        openingId,
        openError,
        setPage,
        openPdf,
    } = useInvoices()

    const offset = (page - 1) * INVOICES_PER_PAGE
    const rows = invoices.map((inv, i) => toRow(inv, i, offset))

    return (
        <div className={styles.page}>
            {hintOpen && (
                <div className={styles.hint} role="note">
                    <button
                        type="button"
                        className={styles.hintClose}
                        onClick={() => setHintOpen(false)}
                        aria-label="بستن راهنما"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>
                    <p className={styles.hintText}>
                        کاربر گرامی جهت مشاهده فاکتور به صورت <span dir="ltr">pdf</span> بر
                        روی ردیف مورد نظر کلیک نمایید
                    </p>
                </div>
            )}

            {openError && (
                <p className={styles.error} role="alert">
                    {openError}
                </p>
            )}

            <DataTable
                columns={COLUMNS}
                rows={rows}
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                onRowClick={openPdf}
                busyRowId={openingId}
                rowTitle={(row) =>
                    row.pdf_file_id
                        ? 'مشاهده فاکتور به صورت PDF'
                        : 'فایل PDF این فاکتور هنوز آماده نشده است'
                }
                emptyMessage={
                    loading
                        ? 'در حال دریافت فاکتورها…'
                        : error || 'فاکتوری برای نمایش وجود ندارد'
                }
            />
        </div>
    )
}
