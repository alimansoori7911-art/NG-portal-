import { useCallback, useEffect, useState } from 'react'
import { adminOrderService, PAYMENT_METHODS } from '../../../services/orderService'
import { formatToman } from '../../../utils/currency'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { fullName } from '../../../utils/name'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/* وضعیت رسید — از روی `verified_at` تعیین می‌شود، نه فیلد `status`.

   `status` در `PaymentRecordOutput` رشته‌ی آزاد است و اسپک مقدارهایش
   را نبسته؛ ولی `verified_at` صریح است: پر یعنی تأییدشده. */
const paymentState = (p) =>
    p.verified_at ? 'تأیید شده' : 'در انتظار بررسی'

/**
 * تخت کردن پاسخ `GET /admin/orders/payments`.
 *
 * خروجی بک‌اند یک ردیف **به‌ازای هر سفارش** است و رسیدهایش در
 * `PaymentRecords` تودرتو هستند. جدول ولی باید یک ردیف به‌ازای هر
 * **رسید** نشان دهد، وگرنه سفارشی که سه بار واریز داشته فقط یک سطر
 * می‌گیرد و دو رسید دیگر ناپیدا می‌مانند.
 */
function toRows(groups, offset) {
    const rows = []

    for (const g of groups ?? []) {
        for (const p of g.PaymentRecords ?? []) {
            const { date } = formatJalaliDateTime(p.paid_at || p.created_at)

            rows.push({
                id: p.id,
                user: fullName(g),
                /* شماره‌ی پیگیریِ بانک؛ `receipt_ref` کد رهگیری داخلی است */
                trackingCode: p.tracking_number || '—',
                receiptCode: p.receipt_ref || '—',
                source: PAYMENT_METHODS[p.method] ?? p.method ?? '—',
                status: paymentState(p),
                amount: formatToman(p.claimed_amount ?? p.amount),
                date: date || '—',
                /* برای نوار عملیات: تأیید رسید به هر دو شناسه نیاز دارد */
                raw: { payment: p, orderId: g.order_id, userPublicId: g.user_public_id },
            })
        }
    }

    /* شماره‌ی ردیف بعد از تخت شدن زده می‌شود تا پیوسته بماند */
    return rows.map((r, i) => ({ ...r, index: offset + i + 1 }))
}

/**
 * تراکنش‌های سیستم برای پنل ادمین — `GET /admin/orders/payments`.
 *
 * ⚠️ صفحه‌بندی سمت سرور روی **سفارش** است نه رسید، پس تعداد ردیف‌های
 * یک صفحه ممکن است از `ROWS_PER_PAGE` بیشتر شود. این عمدی است:
 * شکستن یک سفارش بین دو صفحه گیج‌کننده‌تر از یک صفحه‌ی کمی بلندتر است.
 */
export function useAdminPayments() {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } = await adminOrderService.getAllPayments({
                    page,
                    limit: ROWS_PER_PAGE,
                })
                if (cancelled) return

                setRows(toRows(items, (page - 1) * ROWS_PER_PAGE))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'دریافت تراکنش‌ها ناموفق بود')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, attempt])

    return { rows, page, pageCount, loading, error, setPage, reload }
}
