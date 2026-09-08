import { useState } from 'react'
import { X } from 'lucide-react'
import AdminTable from '../components/AdminTable/AdminTable'
import InvoiceForm from '../components/InvoiceForm/InvoiceForm'
import ComingSoon from '../../../components/ui/ComingSoon/ComingSoon'
import styles from './FinancePage.module.css'

/* ستون‌های تراکنش‌ها — از اسکرین‌شات فیگما (۷ ستون).
   SVG این تب نرسیده بود، پس عرض‌ها متناسب با محتوا تنظیم شده. */
const TRANSACTION_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '9.50%' },
    { key: 'user', label: 'نام کاربر', width: '14.00%', ltr: true },
    { key: 'trackingCode', label: 'شماره پیگیری', width: '15.50%', ltr: true },
    { key: 'receiptCode', label: 'کد رهگیری', width: '14.50%', ltr: true },
    { key: 'source', label: 'منبع', width: '17.00%' },
    { key: 'status', label: 'وضعیت', width: '15.50%' },
    { key: 'date', label: 'تاریخ', width: '14.00%', ltr: true },
]

/* ستون‌های فاکتورها — از tab2.svg */
const INVOICE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '17.95%' },
    { key: 'user', label: 'نام کاربر', width: '31.24%', ltr: true },
    { key: 'serial', label: 'شماره سریال فاکتور', width: '31.19%', ltr: true },
    { key: 'issuedAt', label: 'تاریخ صدور', width: '19.62%', ltr: true },
]

const TABS = [
    { id: 'transactions', label: 'تراکنش‌ها' },
    { id: 'invoices', label: 'مدیریت و صدور فاکتور' },
]

/**
 * مدیریت مالی — دو تب: تراکنش‌ها و مدیریت/صدور فاکتور.
 *
 * TODO: هیچ‌کدام اندپوینت ندارند. رجوع به BACKEND_NEEDS.md
 */
export default function FinancePage() {
    const [tab, setTab] = useState('transactions')
    const [page, setPage] = useState(1)
    const [selectedId, setSelectedId] = useState(null)
    const [creating, setCreating] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    const switchTab = (id) => {
        setTab(id)
        setPage(1)
        setSelectedId(null)
        setCreating(false)
        setFieldErrors({})
    }

    const toggleRow = (row) =>
        setSelectedId((id) => (id === row.id ? null : row.id))

    const isInvoices = tab === 'invoices'

    /* در تب فاکتورها نوار عملیات یک دکمه دارد؛ در تراکنش‌ها
       فیگما نوار عملیاتی نشان نمی‌دهد. */
    const rowActions = () => (
        <div className={styles.rowActions}>
            <button
                type="button"
                className={styles.rowActionBtn}
                onClick={(e) => e.stopPropagation()}
            >
                مشاهده فاکتور الکترونیکی/کاغذ
            </button>

            <button
                type="button"
                className={styles.rowActionsClose}
                onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(null)
                }}
                aria-label="بستن نوار عملیات"
            >
                <X size={14} strokeWidth={3} />
            </button>
        </div>
    )

    const handleCreateInvoice = (values) => {
        /* TODO: اندپوینت صدور فاکتور وجود ندارد.
           فعلاً فقط اعتبارسنجی خالی نبودن. */
        const errors = {}
        if (!values.serial.trim()) errors.serial = 'شماره سریال فاکتور الزامی است'
        if (!values.paymentId.trim()) errors.paymentId = 'شناسه پرداخت الزامی است'

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }
        setFieldErrors({})
        setCreating(false)
    }

    return (
        <div className={styles.page}>
            <div className={styles.tabs}>
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
                        onClick={() => switchTab(id)}
                        aria-current={tab === id ? 'true' : undefined}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <ComingSoon note="تراکنش‌ها و صدور فاکتور در فاز توسعه اضافه می‌شوند.">
            {creating ? (
                <InvoiceForm
                    fieldErrors={fieldErrors}
                    onSubmit={handleCreateInvoice}
                    onFieldChange={(key) =>
                        setFieldErrors((prev) => {
                            const next = { ...prev }
                            delete next[key]
                            return next
                        })
                    }
                    onClose={() => {
                        setCreating(false)
                        setFieldErrors({})
                    }}
                />
            ) : (
                <>
                    {/* دکمه‌ی صدور فاکتور فقط در تب فاکتورها */}
                    {isInvoices && (
                        <div className={styles.toolbar}>
                            <button
                                type="button"
                                className={styles.createBtn}
                                onClick={() => setCreating(true)}
                            >
                                صدور فاکتور
                            </button>
                        </div>
                    )}

                    <AdminTable
                        columns={isInvoices ? INVOICE_COLUMNS : TRANSACTION_COLUMNS}
                        rows={[]}
                        page={page}
                        onPageChange={setPage}
                        selectedId={isInvoices ? selectedId : null}
                        onRowClick={isInvoices ? toggleRow : undefined}
                        renderRowActions={isInvoices ? rowActions : undefined}
                    />
                </>
            )}
            </ComingSoon>
        </div>
    )
}
