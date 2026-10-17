import { useState } from 'react'
import { X } from 'lucide-react'
import AdminTable from '../components/AdminTable/AdminTable'
import InvoiceForm from '../components/InvoiceForm/InvoiceForm'
import { useAdminPayments } from '../hooks/useAdminPayments'
import { useAdminInvoices, useInvoiceActions } from '../hooks/useAdminInvoices'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useSalesReport } from '../hooks/useSalesReport'
import DiscountForm from '../components/DiscountForm/DiscountForm'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useDiscounts, useDiscountActions } from '../hooks/useDiscounts'
import { formatToman } from '../../../utils/currency'
import styles from './FinancePage.module.css'

/* ستون‌های تراکنش‌ها — از اسکرین‌شات فیگما (۷ ستون).
   SVG این تب نرسیده بود، پس عرض‌ها متناسب با محتوا تنظیم شده. */
const TRANSACTION_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '7.00%' },
    { key: 'user', label: 'نام کاربر', width: '14.00%' },
    { key: 'trackingCode', label: 'شماره پیگیری', width: '14.00%', ltr: true },
    { key: 'receiptCode', label: 'کد رهگیری', width: '13.00%', ltr: true },
    { key: 'source', label: 'منبع', width: '13.00%' },
    /* مبلغ در فیگما نبود ولی مهم‌ترین ستون یک جدول تراکنش است */
    { key: 'amount', label: 'مبلغ', width: '15.00%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '13.00%' },
    { key: 'date', label: 'تاریخ', width: '11.00%', ltr: true },
]

/* ستون‌های فاکتورها — از tab2.svg

   ⚠️ ستون «نام کاربر» که در فیگما بود حذف شد: خروجی
   `GET /admin/invoice/` از نوع `PublicInvoiceListItemSchema` است که
   نه `user_id` دارد نه نام کاربر — حتی `AdminInvoiceDetailSchema`
   هم ندارد. پس این ستون همیشه '—' می‌شد.
   به‌جایش نوع و مبلغ را نشان می‌دهیم که واقعاً می‌آیند.
   از بک‌اند خواسته شد (بند ۱.۳ در BACKEND_REQUESTS.md). */
const INVOICE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '10%' },
    { key: 'serial', label: 'شماره سریال فاکتور', width: '28%', ltr: true },
    { key: 'type', label: 'نوع', width: '16%' },
    { key: 'amount', label: 'مبلغ', width: '24%', ltr: true },
    { key: 'issuedAt', label: 'تاریخ صدور', width: '22%', ltr: true },
]

const TABS = [
    { id: 'transactions', label: 'تراکنش‌ها' },
    { id: 'discounts', label: 'کدهای تخفیف' },
    { id: 'invoices', label: 'مدیریت و صدور فاکتور' },
]

/* ستون‌های کد تخفیف — فیگمایی برایش نرسیده بود، عرض‌ها متناسب با
   محتوا تنظیم شده. */
const DISCOUNT_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '7%' },
    { key: 'code', label: 'کد', width: '16%', ltr: true },
    { key: 'type', label: 'نوع', width: '12%' },
    { key: 'value', label: 'مقدار', width: '14%', ltr: true },
    { key: 'target', label: 'دامنه', width: '15%' },
    { key: 'usage', label: 'استفاده', width: '13%', ltr: true },
    {
        key: 'status',
        label: 'وضعیت',
        width: '12%',
        render: (row) => (
            <span className={`${styles.badge} ${styles['badge_' + row.status.key]}`}>
                {row.status.label}
            </span>
        ),
    },
    { key: 'validUntil', label: 'معتبر تا', width: '11%', ltr: true },
]

/**
 * مدیریت مالی — دو تب.
 *
 * «تراکنش‌ها» به `GET /admin/orders/payments` وصل است: فهرست همه‌ی
 * رسیدهای پرداخت سیستم. تا پیش از این تنها راه دیدن رسید، باز کردن
 * تک‌تک سفارش‌ها در صفحه‌ی فروش بود.
 *
 * «مدیریت و صدور فاکتور» از اسپک ۲۲ به `/admin/invoice/` وصل شد
 * (قبلاً زیر پوشش «به‌زودی» با جدول خالی هاردکد بود).
 */
export default function FinancePage() {
    const [tab, setTab] = useState('transactions')
    const payments = useAdminPayments()
    const sales = useSalesReport()

    /* کد تخفیف — `discountForm` حالت فرم است: null بسته،
       'new' صدور، و یک شیء یعنی ویرایش همان کد. */
    const discounts = useDiscounts()
    const discountActions = useDiscountActions()
    const [discountForm, setDiscountForm] = useState(null)
    const [revoking, setRevoking] = useState(null)

    const closeDiscountForm = () => {
        setDiscountForm(null)
        discountActions.clearError()
    }

    const saveDiscount = async (payload) => {
        const ok =
            discountForm === 'new'
                ? await discountActions.create(payload)
                : await discountActions.update(discountForm.id, payload)

        if (ok) {
            closeDiscountForm()
            discounts.reload()
        }
    }

    const confirmRevoke = async () => {
        const ok = await discountActions.revoke(revoking.id)
        if (ok) {
            setRevoking(null)
            setSelectedId(null)
            discounts.reload()
        }
    }
    const [selectedId, setSelectedId] = useState(null)
    const [creating, setCreating] = useState(false)

    /* فاکتورها — اسپک ۲۲.
       فهرست کاربران برای انتخاب گیرنده‌ی فاکتور لازم است؛
       `user_id` در `InvoiceAdminCreate` اجباری است. */
    const invoices = useAdminInvoices()
    const invoiceActions = useInvoiceActions(() => {
        setCreating(false)
        invoices.reload()
    })
    const adminUsers = useAdminUsers()
    const [fieldErrors, setFieldErrors] = useState({})

    const switchTab = (id) => {
        setTab(id)
        /* هر تب صفحه‌بندی خودش را دارد؛ فاکتور باید به صفحه‌ی ۱
           برگردد وگرنه با بازگشت به تب، صفحه‌ی قبلی باز می‌ماند. */
        invoices.setPage(1)
        setSelectedId(null)
        setCreating(false)
        setFieldErrors({})
        setDiscountForm(null)
        setRevoking(null)
    }

    const toggleRow = (row) =>
        setSelectedId((id) => (id === row.id ? null : row.id))

    const isInvoices = tab === 'invoices'
    const isDiscounts = tab === 'discounts'

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

    /* اعتبارسنجی مطابق `InvoiceAdminCreate`: کاربر و دست‌کم یک قلمِ
       معتبر اجباری‌اند. جلوی ارسال نامعتبر را همینجا می‌گیریم تا
       کاربر پیام فارسی ببیند نه ۴۲۲ی که فیلدش معلوم نیست. */
    const handleCreateInvoice = async (payload) => {
        const errors = {}

        if (!payload.user_id) errors.user_id = 'کاربر را انتخاب کنید'

        const valid = payload.items.filter(
            (it) => it.title && it.quantity > 0 && it.unit_price > 0
        )
        if (valid.length === 0) {
            errors.items = 'دست‌کم یک قلم با عنوان، تعداد و قیمت لازم است'
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        setFieldErrors({})
        await invoiceActions.create({ ...payload, items: valid })
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

            {/* هر سه تب حالا داده‌ی واقعی دارند */}
            {isDiscounts ? (
                discountForm ? (
                    <DiscountForm
                        discount={discountForm === 'new' ? null : discountForm}
                        busy={discountActions.busy}
                        error={discountActions.error}
                        onSubmit={saveDiscount}
                        onClose={closeDiscountForm}
                    />
                ) : (
                    <>
                        {discounts.error && (
                            <p className={styles.error} role="alert">
                                {discounts.error}
                            </p>
                        )}

                        <div className={styles.toolbar}>
                            <button
                                type="button"
                                className={styles.createBtn}
                                onClick={() => setDiscountForm('new')}
                            >
                                صدور کد تخفیف
                            </button>
                        </div>

                        <AdminTable
                            columns={DISCOUNT_COLUMNS}
                            rows={discounts.rows}
                            page={discounts.page}
                            pageCount={discounts.pageCount}
                            onPageChange={discounts.setPage}
                            selectedId={selectedId}
                            onRowClick={toggleRow}
                            renderRowActions={(row) => (
                                <div className={styles.rowActions}>
                                    <button
                                        type="button"
                                        className={styles.rowActionBtn}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDiscountForm(row.raw)
                                        }}
                                    >
                                        ویرایش کد
                                    </button>

                                    {/* کد باطل‌شده دوباره باطل نمی‌شود */}
                                    {!row.raw.is_revoked && (
                                        <button
                                            type="button"
                                            className={styles.rowActionDanger}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setRevoking(row)
                                            }}
                                        >
                                            باطل کردن
                                        </button>
                                    )}
                                </div>
                            )}
                            emptyMessage={
                                discounts.loading
                                    ? 'در حال دریافت…'
                                    : 'کد تخفیفی صادر نشده است'
                            }
                        />

                        <ConfirmDialog
                            open={Boolean(revoking)}
                            title="باطل کردن کد تخفیف"
                            message={
                                revoking
                                    ? `کد «${revoking.code}» باطل شود؟ کد حذف نمی‌شود ولی دیگر قابل استفاده نیست.`
                                    : ''
                            }
                            confirmLabel="باطل کن"
                            cancelLabel="انصراف"
                            loading={discountActions.busy}
                            onConfirm={confirmRevoke}
                            onClose={() => setRevoking(null)}
                        />
                    </>
                )
            ) : isInvoices ? (
                creating ? (
                    <InvoiceForm
                        users={adminUsers.rows}
                        usersLoading={adminUsers.loading}
                        saving={invoiceActions.busy}
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
                            invoiceActions.clearError()
                        }}
                    />
                ) : (
                    <>
                        {invoiceActions.error && (
                            <p className={styles.error} role="alert">
                                {invoiceActions.error}
                            </p>
                        )}

                        <div className={styles.toolbar}>
                            <button
                                type="button"
                                className={styles.createBtn}
                                onClick={() => setCreating(true)}
                            >
                                صدور فاکتور
                            </button>
                        </div>

                        <AdminTable
                            columns={INVOICE_COLUMNS}
                            rows={invoices.rows}
                            page={invoices.page}
                            pageCount={invoices.pageCount}
                            onPageChange={invoices.setPage}
                            selectedId={selectedId}
                            onRowClick={toggleRow}
                            renderRowActions={rowActions}
                            emptyMessage={
                                invoices.loading
                                    ? 'در حال دریافت فاکتورها…'
                                    : invoices.error || 'فاکتوری صادر نشده است'
                            }
                        />
                    </>
                )
            ) : (
                <>
                    {payments.error && (
                        <p className={styles.error} role="alert">
                            {payments.error}
                        </p>
                    )}

                    {/* ✅ گزارش فروش — اسپک ۲۱ اندپوینت تجمیعی داد.

                        تا پیش از این، کارت‌ها جمعِ **یک صفحه** را نشان
                        می‌دادند و برچسبشان همین را می‌گفت. حالا عدد
                        واقعیِ کل سیستم در یک بازه است. */}
                    <div className={styles.reportBar}>
                        <label className={styles.reportField}>
                            <span className={styles.reportLabel}>از تاریخ</span>
                            <input
                                className={styles.reportInput}
                                value={sales.range.from}
                                onChange={(e) => sales.setField('from', e.target.value)}
                                placeholder="۱۴۰۴/۰۶/۰۱"
                                dir="ltr"
                            />
                        </label>

                        <label className={styles.reportField}>
                            <span className={styles.reportLabel}>تا تاریخ</span>
                            <input
                                className={styles.reportInput}
                                value={sales.range.to}
                                onChange={(e) => sales.setField('to', e.target.value)}
                                placeholder="۱۴۰۴/۰۶/۳۱"
                                dir="ltr"
                            />
                        </label>

                        <button
                            type="button"
                            className={styles.reportBtn}
                            onClick={sales.run}
                            disabled={sales.loading}
                        >
                            {sales.loading ? 'در حال محاسبه…' : 'نمایش گزارش'}
                        </button>
                    </div>

                    {sales.error && (
                        <p className={styles.error} role="alert">
                            {sales.error}
                        </p>
                    )}

                    <div className={styles.summary}>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                                تأییدشده در این بازه
                            </span>
                            <span className={styles.summaryValueOk}>
                                {sales.data
                                    ? formatToman(sales.data.total_verified)
                                    : '—'}
                            </span>
                        </div>

                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                                در انتظار بررسی در این بازه
                            </span>
                            <span className={styles.summaryValueWarn}>
                                {sales.data
                                    ? formatToman(sales.data.total_pending)
                                    : '—'}
                            </span>
                        </div>

                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                                تعداد رسید در این بازه
                            </span>
                            <span className={styles.summaryValue}>
                                {sales.data
                                    ? Number(sales.data.count).toLocaleString('fa-IR')
                                    : '—'}
                            </span>
                        </div>

                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                                کل سفارش‌های دارای رسید
                            </span>
                            <span className={styles.summaryValue}>
                                {payments.total.toLocaleString('fa-IR')}
                            </span>
                        </div>
                    </div>

                    <AdminTable
                        columns={TRANSACTION_COLUMNS}
                        rows={payments.rows}
                        page={payments.page}
                        onPageChange={payments.setPage}
                        pageCount={payments.pageCount}
                        emptyMessage={
                            payments.loading
                                ? 'در حال دریافت…'
                                : 'تراکنشی ثبت نشده است'
                        }
                    />
                </>
            )}
        </div>
    )
}
