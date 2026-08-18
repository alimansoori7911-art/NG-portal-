import { useCallback, useEffect, useState } from 'react'
import { orderService, statusLabel } from '../../../services/orderService'
import { formatJalaliDateTime } from '../../../utils/datetime'

/* هر صفحه ۱۰ ردیف — هم‌راستا با جدول فیگما */
export const ORDERS_PER_PAGE = 10

/**
 * تبدیل OrderOutput بک‌اند به ردیف جدول.
 *
 * نام پلن از snapshot_plan_name خوانده می‌شود نه از رابطه‌ی plan:
 * بک‌اند عمداً «عکس لحظه‌ای» نگه می‌دارد تا اگر پلن بعداً تغییر نام داد
 * یا حذف شد، سفارش قدیمی همان چیزی را نشان دهد که کاربر خریده.
 */
function toRow(order, i, offset) {
    const { date } = formatJalaliDateTime(order.created_at)

    return {
        id: order.id,
        index: offset + i + 1,
        date,
        plan: order.snapshot_plan_name ?? order.snapshot_product_name ?? '—',
        status: statusLabel(order.status),
        /* برای عملیات لغو لازم است */
        rawStatus: order.status,
        orderNumber: order.order_number,
    }
}

/**
 * لیست سفارش‌های کاربر جاری.
 *
 * خروجی: { rows, page, pageCount, loading, error, setPage, reload }
 */
export function useOrders() {
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
                const { items, pagination } = await orderService.getOrders({
                    page,
                    limit: ORDERS_PER_PAGE,
                })
                if (cancelled) return

                const offset = (page - 1) * ORDERS_PER_PAGE
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
    }, [page, attempt])

    return { rows, page, pageCount, loading, error, setPage, reload }
}
