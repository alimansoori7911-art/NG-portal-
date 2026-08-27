import { useCallback, useEffect, useState } from 'react'
import { auditService } from '../../../services/auditService'
import { formatJalaliDateTime } from '../../../utils/datetime'

/* لاگ‌ها دو ستونه نمایش داده می‌شوند، پس عدد زوج انتخاب شده تا
   ردیف آخر نیمه‌خالی نماند. */
export const AUDIT_PER_PAGE = 20

/**
 * تبدیل AuditLogSchema به آیتم AuditLogList.
 *
 * فیگما «ادمین مربوطه» را نام می‌خواهد ولی بک‌اند فقط `actor_id`
 * عددی می‌دهد (همان مشکل جدول سفارش و تیکت)، پس شناسه با # نشان
 * داده می‌شود.
 *
 * `action` رشته‌ی خام بک‌اند است (مثل `user.delete`) و ترجمه‌ی
 * فارسی ندارد؛ هرچه آمد همان نمایش داده می‌شود.
 */
function toItem(log) {
    const { date, time } = formatJalaliDateTime(log.created_at)

    return {
        id: log.id,
        action: log.action || '—',
        admin: log.actor_id != null ? `#${log.actor_id}` : '—',
        ip: log.ip_address || '—',
        time: date ? `${date} ${time}` : '—',
        /* برای فیلتر و نمایش جزئیات */
        raw: log,
    }
}

/**
 * لاگ‌های ممیزی — صفحه‌بندی سمت سرور با فیلترهای اختیاری.
 *
 * `filters` باید بین رندرها پایدار باشد وگرنه افکت بی‌نهایت اجرا
 * می‌شود؛ به همین دلیل به‌جای خود شیء، رشته‌ی JSON آن به وابستگی‌ها
 * داده شده.
 */
export function useAuditLogs(filters = {}) {
    const [items, setItems] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    const filterKey = JSON.stringify(filters)

    /* با تغییر فیلتر باید به صفحه‌ی اول برگردیم وگرنه ممکن است روی
       صفحه‌ای بمانیم که در نتیجه‌ی جدید وجود ندارد.

       این کار حین رندر انجام می‌شود نه در useEffect، چون setState داخل
       افکت یک رندر آبشاری اضافه می‌سازد:
       https://react.dev/learn/you-might-not-need-an-effect */
    const [lastFilterKey, setLastFilterKey] = useState(filterKey)
    if (lastFilterKey !== filterKey) {
        setLastFilterKey(filterKey)
        setPage(1)
    }

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items: data, pagination } = await auditService.getLogs({
                    page,
                    limit: AUDIT_PER_PAGE,
                    ...JSON.parse(filterKey),
                })
                if (cancelled) return

                setItems((data ?? []).map(toItem))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت لاگ‌ها ناموفق بود')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, attempt, filterKey])

    return { items, page, pageCount, loading, error, setPage, reload }
}
