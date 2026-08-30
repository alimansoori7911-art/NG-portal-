import { useCallback, useEffect, useState } from 'react'
import { adminOrderService, statusLabel } from '../../../services/orderService'
import { formatToman } from '../../../utils/currency'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/**
 * تبدیل OrderOutput به ردیف جدول فروش.
 *
 * ستون «خریدار» در فیگما نام کاربر است ولی خروجی سفارش فقط user_id
 * عددی دارد؛ تا اضافه شدن نام از سمت بک‌اند، شناسه نشان داده می‌شود.
 * (در BACKEND_NEEDS.md ثبت شده)
 *
 * مبلغ‌ها ریال می‌آیند و تومان نمایش داده می‌شوند.
 */
function toRow(order, i, offset) {
    const { date } = formatJalaliDateTime(order.created_at)

    return {
        id: order.id,
        index: offset + i + 1,
        orderCode: order.order_number,
        buyer: order.user_id != null ? `#${order.user_id}` : '—',
        amount: formatToman(order.payable_amount ?? order.quoted_amount),
        paymentStatus: statusLabel(order.status),
        plan: order.snapshot_plan_name || order.snapshot_product_name || '—',
        date,
        /* داده‌ی خام برای نوار عملیات */
        raw: order,
    }
}

/**
 * سفارش‌های سیستم برای پنل ادمین — با صفحه‌بندی سمت سرور.
 */
export function useAdminOrders({ status } = {}) {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    /* با تغییر فیلتر به صفحه‌ی اول برمی‌گردیم وگرنه ممکن است روی
       صفحه‌ای بمانیم که در نتیجه‌ی جدید وجود ندارد. */
    useEffect(() => {
        setPage(1)
    }, [status])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } = await adminOrderService.getOrders({
                    page,
                    limit: ROWS_PER_PAGE,
                    status,
                })
                if (cancelled) return

                const offset = (page - 1) * ROWS_PER_PAGE
                setRows((items ?? []).map((o, i) => toRow(o, i, offset)))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت سفارش‌ها ناموفق بود')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, attempt, status])

    return { rows, page, pageCount, loading, error, setPage, reload }
}

/**
 * عملیات روی یک سفارش: صدور پیش‌فاکتور، تأیید رسید، تغییر وضعیت.
 *
 * از useAdminOrders جداست چون چرخه‌ی عمر متفاوتی دارد — لیست همیشه
 * هست ولی عملیات فقط وقتی ردیفی انتخاب شده.
 */
export function useOrderActions(onDone) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    /* هر سه عملیات الگوی یکسانی دارند، پس در یک تابع جمع شده‌اند
       تا مدیریت خطا و busy در سه جا تکرار نشود. */
    const run = useCallback(
        async (fn) => {
            setBusy(true)
            setError(null)
            try {
                await fn()
                onDone?.()
                return true
            } catch (err) {
                setError(err?.message || 'عملیات ناموفق بود')
                return false
            } finally {
                setBusy(false)
            }
        },
        [onDone]
    )

    return {
        busy,
        error,
        clearError: () => setError(null),

        quote: (orderId, values) =>
            run(() => adminOrderService.quote(orderId, values)),

        verifyPayment: (orderId, paymentId, note) =>
            run(() => adminOrderService.verifyPayment(orderId, paymentId, note)),

        changeStatus: (orderId, status, note) =>
            run(() => adminOrderService.changeStatus(orderId, status, note)),

        /* اتصال تیکت به سفارش — گره‌ی «Ticketing (optional, any stage)»
           در فلو. تا اسپک ۱۴ قابل استفاده نبود چون `ticket_id` عدد
           بود در حالی که تیکت‌ها UUID دارند. */
        linkTicket: (orderId, payload) =>
            run(() => adminOrderService.linkTicket(orderId, payload)),
    }
}
