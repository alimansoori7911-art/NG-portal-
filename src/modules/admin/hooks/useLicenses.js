import { useCallback, useEffect, useState } from 'react'
import {
    licenseService,
    LICENSE_LIMIT_LABELS,
} from '../../../services/licenseService'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/* سقف‌ها یک شیء تودرتوست و در یک سلول جا نمی‌شود، پس خلاصه می‌شود:
   «دارایی ۵۰ · ممیزی ۵۰». مقدار تهی یعنی نامحدود. */
function summarizeLimits(limits) {
    if (!limits || typeof limits !== 'object') return '—'

    const parts = Object.entries(LICENSE_LIMIT_LABELS)
        .filter(([key]) => limits[key] != null)
        .map(([key, label]) => `${label} ${Number(limits[key]).toLocaleString('fa-IR')}`)

    return parts.length ? parts.join(' · ') : 'نامحدود'
}

function toRow(license, index) {
    const starts = formatJalaliDateTime(license.starts_at).date
    const expires = formatJalaliDateTime(license.expires_at).date

    return {
        /* لیست شناسه‌ی یکتا نمی‌دهد؛ شماره‌ی سفارش نزدیک‌ترین چیز است */
        id: license.order_number ?? `row-${index}`,
        index: index + 1,
        orderNumber: license.order_number ?? '—',
        startsAt: starts || '—',
        expiresAt: expires || '—',
        limits: summarizeLimits(license.limits),
        status: license.is_active ? 'فعال' : 'غیرفعال',
        raw: license,
    }
}

/**
 * لایسنس‌ها برای پنل ادمین — `GET /license/` (اسپک ۱۷).
 *
 * تا اسپک ۱۶ هیچ اندپوینت لایسنسی نبود و این جدول زیر پوشش
 * «به‌زودی» خالی می‌ماند.
 */
/**
 * @param userId  فقط لایسنس‌های همین کاربر (تهی = همه)
 * @param enabled وقتی false است هیچ درخواستی نمی‌رود. برای مودالی که
 *                بسته است لازم است، وگرنه با `userId` تهی **لایسنس‌های
 *                کل سیستم** گرفته می‌شد.
 */
export function useLicenses({ userId, enabled = true } = {}) {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    /* همان الگوی `useAdminOrders`: تابع async داخل خود افکت تعریف
       می‌شود، وگرنه `setLoading` همگام در بدنه‌ی افکت یک رندر آبشاری
       اضافه می‌سازد. */
    useEffect(() => {
        if (!enabled) return
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } = await licenseService.getLicenses({
                    page,
                    limit: ROWS_PER_PAGE,
                    user_id: userId,
                })
                if (cancelled) return

                const offset = (page - 1) * ROWS_PER_PAGE
                setRows((items ?? []).map((l, i) => toRow(l, offset + i)))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (cancelled) return
                setError(err?.message || 'دریافت لایسنس‌ها ناموفق بود')
                setRows([])
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, userId, attempt, enabled])

    return { rows, page, pageCount, loading, error, setPage, reload }
}
