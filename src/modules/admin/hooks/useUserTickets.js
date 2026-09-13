import { useEffect, useState } from 'react'
import { ticketService, ticketStatusLabel } from '../../../services/ticketService'
import { formatJalaliDateTime } from '../../../utils/datetime'

/* جدول داخل مودال صفحه‌بندی ندارد، پس یک صفحه‌ی بلند گرفته می‌شود */
const LIMIT = 20

/**
 * تیکت‌های یک کاربر مشخص — برای «تیکت‌های کاربر» در پروفایل جامع.
 *
 * ✅ فیلتر `user_id` روی `GET /admin/tickets` از اسپک ۱۷ رسماً در
 * قرارداد است، پس این جدول واقعاً کار می‌کند.
 *
 * نگهبان زیر عمداً نگه داشته شده: اگر سروری که به آن وصلیم قدیمی‌تر
 * باشد، پارامتر را بی‌صدا نادیده می‌گیرد و **تیکت‌های همه‌ی کاربران**
 * برمی‌گردد — که در پروفایل یک کاربر خاص گمراه‌کننده است. هزینه‌اش یک
 * حلقه‌ی کوچک است و جلوی نمایش داده‌ی غلط را می‌گیرد.
 */
export function useUserTickets(userId) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [unfiltered, setUnfiltered] = useState(false)

    useEffect(() => {
        if (!userId) return

        let cancelled = false
        setLoading(true)
        setError(null)
        setUnfiltered(false)

        ticketService
            .getAdminTickets({ page: 1, limit: LIMIT, user_id: userId })
            .then(({ items }) => {
                if (cancelled) return

                const list = items ?? []

                /* اگر تیکتی از کاربر دیگری در نتیجه باشد یعنی فیلتر
                   اعمال نشده. نمایش آن‌ها بدتر از نمایش ندادن است. */
                const foreign = list.some(
                    (t) => t.user_id != null && String(t.user_id) !== String(userId)
                )
                if (foreign) {
                    setUnfiltered(true)
                    setRows([])
                    return
                }

                setRows(
                    list.map((t, i) => ({
                        id: t.id,
                        index: i + 1,
                        status: ticketStatusLabel(t.status_code),
                        date: formatJalaliDateTime(t.created_at).date || '—',
                        department: t.department_id ?? '—',
                    }))
                )
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || 'دریافت تیکت‌ها ناموفق بود')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [userId])

    return { rows: userId ? rows : [], loading, error, unfiltered }
}
