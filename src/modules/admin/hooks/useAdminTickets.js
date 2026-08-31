import { useCallback, useEffect, useState } from 'react'
import {
    ticketService,
    ticketStatusLabel,
} from '../../../services/ticketService'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/**
 * تبدیل TicketOutSchema به ردیف جدول ادمین.
 *
 * دو ستون فیگما در بک‌اند معادل مستقیم ندارند:
 *   نام کاربری — خروجی تیکت فقط user_id عددی دارد، نه نام.
 *   کارشناس     — همچنین assigned_to_user_id.
 * تا وقتی بک‌اند این‌ها را اضافه نکند، شناسه نشان داده می‌شود.
 * (در BACKEND_NEEDS.md ثبت شده)
 */
function toRow(ticket, i, offset, nameOf) {
    const { date } = formatJalaliDateTime(ticket.created_at)

    return {
        id: ticket.id,
        index: offset + i + 1,
        username: ticket.user_id != null ? `#${ticket.user_id}` : '—',
        status: ticketStatusLabel(ticket.status_code),
        rawStatus: ticket.status_code,
        department: nameOf?.(ticket.department_id) || '—',
        date,
        agent:
            ticket.assigned_to_user_id != null
                ? `#${ticket.assigned_to_user_id}`
                : 'تخصیص نیافته',
        subject: ticket.subject,
        ticketNumber: ticket.ticket_number,
        departmentId: ticket.department_id,
    }
}

/**
 * لیست تیکت‌ها برای پنل ادمین — با صفحه‌بندی سمت سرور.
 *
 * برخلاف useTickets کاربر، این‌جا فیلتر وضعیت و جستجو هم لازم است.
 */
export function useAdminTickets(nameOf, { status, q } = {}) {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    /* با تغییر فیلتر باید به صفحه‌ی اول برگردیم وگرنه ممکن است
       روی صفحه‌ای بمانیم که در نتیجه‌ی جدید وجود ندارد. */
    useEffect(() => {
        setPage(1)
    }, [status, q])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } = await ticketService.getAdminTickets({
                    page,
                    limit: ROWS_PER_PAGE,
                    status,
                    q,
                })
                if (cancelled) return

                const offset = (page - 1) * ROWS_PER_PAGE
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
    }, [page, attempt, status, q, nameOf])

    return { rows, page, pageCount, loading, error, setPage, reload }
}
