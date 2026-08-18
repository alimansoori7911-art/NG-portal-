import { useCallback, useEffect, useState } from 'react'
import { ticketService, ticketStatusLabel } from '../../../services/ticketService'
import { formatJalaliDateTime } from '../../../utils/datetime'

/* هر صفحه ۹ ردیف — مطابق جدول فیگما */
export const TICKETS_PER_PAGE = 9

/**
 * تبدیل TicketOutSchema بک‌اند به ردیف جدول.
 *
 * بک‌اند نام دپارتمان را در خروجی تیکت نمی‌دهد، فقط department_id.
 * برای همین نگاشت نام از هوک useDepartments تزریق می‌شود.
 */
function toRow(ticket, i, offset, nameOf) {
    const { date } = formatJalaliDateTime(ticket.created_at)

    return {
        id: ticket.id,
        index: offset + i + 1,
        date,
        department: nameOf?.(ticket.department_id) || '—',
        status: ticketStatusLabel(ticket.status_code),
        /* برای مودال جزئیات و کنترل دکمه‌ها */
        rawStatus: ticket.status_code,
        subject: ticket.subject,
        ticketNumber: ticket.ticket_number,
    }
}

/**
 * لیست تیکت‌های کاربر جاری.
 *
 * nameOf از useDepartments می‌آید تا department_id به نام تبدیل شود.
 * تا وقتی دپارتمان‌ها نرسیده‌اند ستون دپارتمان «—» نشان می‌دهد و با
 * رسیدنشان دوباره محاسبه می‌شود.
 */
export function useTickets(nameOf) {
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
                const { items, pagination } = await ticketService.getTickets({
                    page,
                    limit: TICKETS_PER_PAGE,
                })
                if (cancelled) return

                const offset = (page - 1) * TICKETS_PER_PAGE
                setRows((items ?? []).map((t, i) => toRow(t, i, offset, nameOf)))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت تیکت‌ها ناموفق بود')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, attempt, nameOf])

    return { rows, page, pageCount, loading, error, setPage, reload }
}
