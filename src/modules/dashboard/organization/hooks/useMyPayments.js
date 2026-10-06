import { useEffect, useState } from 'react'
import { orderService } from '../../../../services/orderService'
import { formatToman } from '../../../../utils/currency'
import { formatJalaliDateTime } from '../../../../utils/datetime'

const PER_PAGE = 10

/**
 * همه‌ی پرداخت‌های کاربر جاری.
 *
 * ⚠️ وضعیت از `verified_at` خوانده می‌شود نه فیلد `status` — همان
 * قاعده‌ای که پنل ادمین دارد: `status` ممکن است هنوز روی مقدار قبلی
 * مانده باشد، ولی `verified_at` صریح است (پر یعنی تأییدشده).
 */
export function useMyPayments() {
    const [page, setPage] = useState(1)
    const [state, setState] = useState({
        key: null,
        rows: [],
        pageCount: 1,
        error: null,
    })

    const key = String(page)

    useEffect(() => {
        let cancelled = false

        orderService
            .getMyPayments({ page, limit: PER_PAGE })
            .then(({ items, pagination }) => {
                if (cancelled) return

                const offset = (page - 1) * PER_PAGE
                setState({
                    key: String(page),
                    rows: (items ?? []).map((p, i) => {
                        const { date } = formatJalaliDateTime(p.paid_at ?? p.created_at)

                        return {
                            id: p.id,
                            index: offset + i + 1,
                            /* `claimed_amount` مبلغی است که کاربر گفته
                               پرداخت کرده؛ تا تأیید نشده همان ملاک است. */
                            amount: formatToman(
                                Number(p.amount ?? p.claimed_amount) || 0
                            ),
                            method: p.method || '—',
                            tracking: p.tracking_number || '—',
                            date: date || '—',
                            verified: Boolean(p.verified_at),
                            statusLabel: p.verified_at
                                ? 'تأیید شده'
                                : 'در انتظار بررسی',
                            orderNumber: p.order_number || '—',
                        }
                    }),
                    pageCount: pagination?.total_pages ?? 1,
                    error: null,
                })
            })
            .catch((err) => {
                if (cancelled) return
                setState({
                    key: String(page),
                    rows: [],
                    pageCount: 1,
                    error: err?.message || 'دریافت پرداخت‌ها ناموفق بود',
                })
            })

        return () => {
            cancelled = true
        }
    }, [page])

    const fresh = state.key === key
    return {
        rows: fresh ? state.rows : [],
        pageCount: fresh ? state.pageCount : 1,
        error: fresh ? state.error : null,
        loading: !fresh,
        page,
        setPage,
    }
}
