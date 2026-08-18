import { useState } from 'react'
import { X } from 'lucide-react'
import AdminTable from '../components/AdminTable/AdminTable'
import LicenseForm from '../components/LicenseForm/LicenseForm'
import { MOCK_SALES_ORDERS, MOCK_LICENSES } from '../data/mockSales'
import styles from './SalesPage.module.css'

/* عرض ستون‌ها از tab11.svg (جدول سفارش‌ها) */
const ORDER_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '11.53%' },
    { key: 'orderCode', label: 'کد سفارش', width: '15.89%', ltr: true },
    { key: 'buyer', label: 'خریدار', width: '14.45%', ltr: true },
    { key: 'amount', label: 'مبلغ', width: '16.31%' },
    { key: 'paymentStatus', label: 'وضعیت پرداخت', width: '16.18%' },
    { key: 'plan', label: 'پلن', width: '13.81%', ltr: true },
    { key: 'date', label: 'تاریخ', width: '11.83%', ltr: true },
]

/* عرض ستون‌ها از tab2.svg (جدول لایسنس‌ها) */
const LICENSE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '15.04%' },
    { key: 'licenseCode', label: 'کد لایسنس', width: '22.27%', ltr: true },
    { key: 'user', label: 'کاربر', width: '21.35%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '22.78%' },
    { key: 'server', label: 'سرور متصل', width: '18.56%', ltr: true },
]

/* دکمه‌های نوار عملیات — ترتیب از راست، مطابق SVG.
   TODO: هیچ‌کدام اندپوینت ندارند. رجوع به BACKEND_NEEDS.md */
const ORDER_ACTIONS = ['صدور فاکتور', 'مشاهده فاکتور']
const LICENSE_ACTIONS = [
    'فعال سازی لایسنس',
    'غیرفعال سازی لایسنس',
    'تمدید زمان لایسنس',
    'فسخ لایسنس',
]

const TABS = [
    { id: 'orders', label: 'پیگیری سفارش‌ها / خریدها' },
    { id: 'licenses', label: 'مدیریت لایسنس‌ها' },
]

/**
 * فروش و مشتریان — دو تب: پیگیری سفارش‌ها و مدیریت لایسنس‌ها.
 *
 * الگوی جدول + نوار عملیات کشویی همان چیزی است که در «کاربران و
 * دسترسی‌ها» ساخته شد، پس AdminTable بدون تغییر استفاده می‌شود.
 */
export default function SalesPage() {
    const [tab, setTab] = useState('orders')
    const [page, setPage] = useState(1)
    const [selectedId, setSelectedId] = useState(null)
    const [creating, setCreating] = useState(false)

    /* در فیگما نمونه‌ی خطا روی «نام کاربری» نشان داده شده.
       TODO: با اتصال واقعی، خطا از پاسخ ۴۲۲ بک‌اند می‌آید. */
    const [fieldErrors, setFieldErrors] = useState({})

    const switchTab = (id) => {
        setTab(id)
        setPage(1)
        setSelectedId(null)
        setCreating(false)
    }

    const toggleRow = (row) =>
        setSelectedId((id) => (id === row.id ? null : row.id))

    const isLicenses = tab === 'licenses'
    const actions = isLicenses ? LICENSE_ACTIONS : ORDER_ACTIONS

    const rowActions = () => (
        <div className={styles.rowActions}>
            {actions.map((label) => (
                <button
                    key={label}
                    type="button"
                    className={styles.rowActionBtn}
                    onClick={(e) => e.stopPropagation()}
                >
                    {label}
                </button>
            ))}

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

    const handleCreateLicense = (values, { withActivation }) => {
        /* TODO: اندپوینت ساخت لایسنس وجود ندارد.
           فعلاً فقط اعتبارسنجی ساده برای نمایش حالت خطای فیگما. */
        if (!values.username.trim()) {
            setFieldErrors({ username: 'این نام کاربری در سیستم موجود نمی باشد' })
            return
        }
        setFieldErrors({})
        setCreating(false)
        void withActivation
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

            {creating ? (
                <LicenseForm
                    fieldErrors={fieldErrors}
                    onSubmit={handleCreateLicense}
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
                    {/* دکمه‌ی ایجاد فقط در تب لایسنس‌ها هست */}
                    {isLicenses && (
                        <div className={styles.toolbar}>
                            <button
                                type="button"
                                className={styles.createBtn}
                                onClick={() => setCreating(true)}
                            >
                                ایجاد لایسنس
                            </button>
                        </div>
                    )}

                    <AdminTable
                        columns={isLicenses ? LICENSE_COLUMNS : ORDER_COLUMNS}
                        rows={isLicenses ? MOCK_LICENSES : MOCK_SALES_ORDERS}
                        page={page}
                        onPageChange={setPage}
                        selectedId={selectedId}
                        onRowClick={toggleRow}
                        renderRowActions={rowActions}
                    />
                </>
            )}
        </div>
    )
}
