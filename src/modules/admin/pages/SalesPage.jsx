import { useState } from 'react'
import { X } from 'lucide-react'
import AdminTable from '../components/AdminTable/AdminTable'
import QuoteForm from '../components/QuoteForm/QuoteForm'
import PaymentVerifyPanel from '../components/PaymentVerifyPanel/PaymentVerifyPanel'
import LinkTicketForm from '../components/LinkTicketForm/LinkTicketForm'
import { useAdminOrders, useOrderActions } from '../hooks/useAdminOrders'
import { useBillingTerms } from '../hooks/useBillingTerms'
import { useLicenses } from '../hooks/useLicenses'
import { ORDER_STATUS, relationTypeLabel } from '../../../services/orderService'
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

/* ستون‌ها بر اساس `LicenseListOutput` اسپک ۱۷، نه فیگما.

   فیگما «کد لایسنس»، «کاربر» و «سرور متصل» می‌خواست ولی هیچ‌کدام در
   پاسخ نیستند — لیست فقط `order_number`, `starts_at`, `expires_at`,
   `limits` و `is_active` می‌دهد. ستون خالی بدتر از ستون نداشتن است،
   پس شماره‌ی سفارش جای کد لایسنس را می‌گیرد (همان چیزی است که لایسنس
   را به خریدارش وصل می‌کند). */
const LICENSE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '10%' },
    { key: 'orderNumber', label: 'شماره سفارش', width: '22%', ltr: true },
    { key: 'startsAt', label: 'شروع', width: '17%', ltr: true },
    { key: 'expiresAt', label: 'انقضا', width: '17%', ltr: true },
    { key: 'limits', label: 'سقف‌ها', width: '20%' },
    { key: 'status', label: 'وضعیت', width: '14%' },
]

/* وضعیت‌هایی که ادمین می‌تواند دستی به آن‌ها ببرد.
   بقیه‌ی وضعیت‌ها خودکارند (مثل PAID_CONFIRMED که با تأیید رسید
   می‌آید) یا فقط کاربر می‌تواند بزند (CANCELED). */
const MANUAL_STATUSES = [
    'AWAITING_ADMIN_REVIEW',
    'TECHNICAL_IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'FAILED',
    'REFUNDED',
]

/* در کدام وضعیت‌ها صدور پیش‌فاکتور معنا دارد */
const QUOTABLE = new Set(['REQUESTED', 'AWAITING_ADMIN_REVIEW', 'QUOTATION_ISSUED'])

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
    const [selectedId, setSelectedId] = useState(null)
    /* کدام سفارش در حال صدور پیش‌فاکتور است */
    const [quoting, setQuoting] = useState(null)
    /* سفارشی که نوار «اتصال تیکت»اش باز است */
    const [linking, setLinking] = useState(null)
    /* منوی باز تغییر وضعیت */
    const [statusMenu, setStatusMenu] = useState(false)

    const orders = useAdminOrders()
    const licenses = useLicenses()
    /* فقط وقتی فرم پیش‌فاکتور باز است بارگذاری می‌شود */
    const billingTerms = useBillingTerms(quoting !== null)
    const actions = useOrderActions(() => {
        orders.reload()
        setStatusMenu(false)
    })

    const switchTab = (id) => {
        setTab(id)
        setSelectedId(null)
        setQuoting(null)
        setLinking(null)
    }

    const toggleRow = (row) => {
        setSelectedId((id) => (id === row.id ? null : row.id))
        setStatusMenu(false)
        actions.clearError()
    }

    const isLicenses = tab === 'licenses'

    /* ─── نوار عملیات سفارش ───
       سه کار اصلی فلو: صدور پیش‌فاکتور، تأیید رسید، تغییر وضعیت. */
    const orderRowActions = (row) => {
        const order = row.raw

        return (
            <div className={styles.orderActions} onClick={(e) => e.stopPropagation()}>
                <div className={styles.rowActions}>
                    <button
                        type="button"
                        className={styles.rowActionBtn}
                        onClick={() => setQuoting(order)}
                        disabled={!QUOTABLE.has(order.status)}
                        title={
                            QUOTABLE.has(order.status)
                                ? undefined
                                : 'در این وضعیت صدور پیش‌فاکتور معنا ندارد'
                        }
                    >
                        صدور پیش‌فاکتور
                    </button>

                    <div className={styles.statusWrap}>
                        <button
                            type="button"
                            className={styles.rowActionBtn}
                            onClick={() => setStatusMenu((v) => !v)}
                            disabled={actions.busy}
                            aria-expanded={statusMenu}
                        >
                            {actions.busy ? 'در حال تغییر…' : 'تغییر وضعیت'}
                        </button>

                        {statusMenu && (
                            <ul className={styles.statusMenu} role="listbox">
                                {MANUAL_STATUSES.map((code) => (
                                    <li key={code}>
                                        <button
                                            type="button"
                                            className={styles.statusOption}
                                            onClick={() =>
                                                actions.changeStatus(order.id, code)
                                            }
                                            role="option"
                                            aria-selected={order.status === code}
                                        >
                                            {ORDER_STATUS[code]}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        type="button"
                        className={styles.rowActionBtn}
                        onClick={() => setLinking((v) => (v ? null : order))}
                        disabled={actions.busy}
                        aria-expanded={linking?.id === order.id}
                    >
                        اتصال تیکت
                    </button>

                    <button
                        type="button"
                        className={styles.rowActionsClose}
                        onClick={() => setSelectedId(null)}
                        aria-label="بستن نوار عملیات"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                </div>

                {/* تیکت‌های وصل‌شده — طبق فلو تیکت در هر مرحله می‌تواند
                    به سفارش بچسبد، پس ادمین باید ببیند چه چیزی وصل است. */}
                {order.ticket_links?.length > 0 && (
                    <ul className={styles.ticketLinks}>
                        {order.ticket_links.map((l) => (
                            <li key={l.id} className={styles.ticketLink}>
                                <span dir="ltr">#{l.ticket_id?.slice(0, 8)}</span>
                                <span className={styles.ticketRelation}>
                                    {relationTypeLabel(l.relation_type)}
                                    {l.is_primary && ' · اصلی'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {linking?.id === order.id && (
                    <LinkTicketForm
                        order={order}
                        busy={actions.busy}
                        error={actions.error}
                        onCancel={() => setLinking(null)}
                        onSubmit={async (values) => {
                            const ok = await actions.linkTicket(order.id, values)
                            if (ok) setLinking(null)
                        }}
                    />
                )}

                {/* رسیدها — تأیید هرکدام جداگانه */}
                <PaymentVerifyPanel
                    payments={order.payments}
                    busy={actions.busy}
                    onVerify={(paymentId) =>
                        actions.verifyPayment(order.id, paymentId)
                    }
                />

                {actions.error && (
                    <p className={styles.actionError} role="alert">
                        {actions.error}
                    </p>
                )}
            </div>
        )
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

            {quoting ? (
                <QuoteForm
                    order={quoting}
                    termList={billingTerms.terms}
                    busy={actions.busy}
                    error={actions.error}
                    onSubmit={async (values) => {
                        const ok = await actions.quote(quoting, values)
                        if (ok) setQuoting(null)
                    }}
                    onClose={() => {
                        setQuoting(null)
                        actions.clearError()
                    }}
                />
            ) : isLicenses ? (
                /* از اسپک ۱۷ `GET /license/` وجود دارد، پس این جدول
                   داده‌ی واقعی نشان می‌دهد و پوشش «به‌زودی» برداشته شد.

                   ⚠️ دکمه‌ی «ایجاد لایسنس» نیست: لایسنس با تأیید
                   پرداخت **خودکار** صادر می‌شود و اندپوینت ساخت دستی
                   در اسپک وجود ندارد. */
                <AdminTable
                    columns={LICENSE_COLUMNS}
                    rows={licenses.rows}
                    page={licenses.page}
                    pageCount={licenses.pageCount}
                    onPageChange={licenses.setPage}
                    emptyMessage={
                        licenses.loading
                            ? 'در حال دریافت لایسنس‌ها…'
                            : licenses.error || 'لایسنسی صادر نشده است'
                    }
                />
            ) : (
                <AdminTable
                    columns={ORDER_COLUMNS}
                    rows={orders.rows}
                    page={orders.page}
                    pageCount={orders.pageCount}
                    onPageChange={orders.setPage}
                    selectedId={selectedId}
                    onRowClick={toggleRow}
                    renderRowActions={orderRowActions}
                    emptyMessage={
                        orders.loading
                            ? 'در حال دریافت سفارش‌ها…'
                            : orders.error || 'سفارشی ثبت نشده است'
                    }
                />
            )}
        </div>
    )
}
