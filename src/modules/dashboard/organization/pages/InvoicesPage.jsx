import { useState } from 'react'
import { X } from 'lucide-react'
import DataTable from '../../components/DataTable/DataTable'
import { MOCK_USER_INVOICES } from '../data/mockInvoices'
import styles from './InvoicesPage.module.css'

/* عرض ستون‌ها از SVG (از راست): 258 | 234.8 | 264 | 263.2  از ۱۰۲۰ */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '25.29%' },
    { key: 'date', label: 'تاریخ', width: '23.02%', ltr: true },
    { key: 'plan', label: 'پلن', width: '25.88%', ltr: true },
    { key: 'serial', label: 'شماره سریال', width: '25.81%', ltr: true },
]

/**
 * فاکتورهای کاربر.
 *
 * نوار راهنمای بالای جدول (۹۶۱×۷۳ در SVG با حاشیه‌ی #7AB0FF) به کاربر
 * می‌گوید برای دیدن PDF روی ردیف کلیک کند و با ضربدر بسته می‌شود.
 *
 * TODO: کلیک روی ردیف باید فاکتور PDF را باز کند — اندپوینتی
 *       برای آن وجود ندارد. رجوع به BACKEND_NEEDS.md
 */
export default function InvoicesPage() {
    const [page, setPage] = useState(1)
    const [hintOpen, setHintOpen] = useState(true)

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

            <DataTable
                columns={COLUMNS}
                rows={MOCK_USER_INVOICES}
                page={page}
                pageCount={2}
                onPageChange={setPage}
                emptyMessage="فاکتوری برای نمایش وجود ندارد"
            />
        </div>
    )
}
