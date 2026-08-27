import { useEffect, useState } from 'react'
import { adminOrderService, statusLabel } from '../../../services/orderService'
import { formatToman } from '../../../utils/currency'
import { formatJalaliDateTime } from '../../../utils/datetime'

/* جدول داخل مودال صفحه‌بندی ندارد (paginate={false})، پس یک صفحه‌ی
   بلند گرفته می‌شود؛ ۲۰ سفارش آخر برای تاریخچه کافی است. */
const LIMIT = 20

/**
 * سفارش‌های یک کاربر مشخص — برای «تاریخچه خرید» در پروفایل جامع.
 *
 * `GET /admin/orders/` فیلتر `user_id` دارد (به‌علاوه‌ی organization_id،
 * product_id، plan_id و order_number)، پس این جدول به داده‌ی نمونه
 * نیازی ندارد.
 */
export function useUserOrders(userId) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        /* بدون کاربر چیزی خوانده نمی‌شود. پاک کردن rows اینجا لازم نیست
           (و رندر آبشاری می‌سازد) چون خروجی زیر با userId محافظت شده. */
        if (!userId) return

        let cancelled = false
        setLoading(true)
        setError(null)

        adminOrderService
            .getOrders({ page: 1, limit: LIMIT, user_id: userId })
            .then(({ items }) => {
                if (cancelled) return
                setRows(
                    (items ?? []).map((o, i) => ({
                        id: o.id,
                        index: i + 1,
                        /* نام پلن از اسنپ‌شات می‌آید تا اگر پلن بعداً
                           عوض شد، سفارش قدیمی همان چیز خریداری‌شده را
                           نشان دهد. */
                        plan: o.snapshot_plan_name || o.snapshot_product_name || '—',
                        orderCode: o.order_number || '—',
                        amount: formatToman(o.payable_amount ?? o.quoted_amount) || '—',
                        status: statusLabel(o.status),
                        date: formatJalaliDateTime(o.created_at).date || '—',
                    }))
                )
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || 'دریافت سفارش‌ها ناموفق بود')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [userId])

    /* با تهی شدن userId ردیف‌های کاربر قبلی نباید دیده شوند */
    return { rows: userId ? rows : [], loading, error }
}
