import { useCallback, useEffect, useState } from 'react'
import {
    licenseService,
    LICENSE_LIMIT_LABELS,
} from '../../../../services/licenseService'
import { formatJalaliDateTime } from '../../../../utils/datetime'

/* هر صفحه ۱۰ ردیف — هم‌راستا با بقیه‌ی جدول‌های داشبورد */
export const LICENSES_PER_PAGE = 10

/* سقف‌ها یک شیء تودرتوست و در یک سلول جا نمی‌شود، پس خلاصه می‌شود:
   «دارایی ۵۰ · ممیزی ۵۰». مقدار تهی یعنی نامحدود. */
function summarizeLimits(limits) {
    if (!limits || typeof limits !== 'object') return '—'

    const parts = Object.entries(LICENSE_LIMIT_LABELS)
        .filter(([key]) => limits[key] != null)
        .map(
            ([key, label]) =>
                `${label} ${Number(limits[key]).toLocaleString('fa-IR')}`
        )

    return parts.length ? parts.join(' · ') : 'نامحدود'
}

function toRow(license, index) {
    return {
        /* `LicenseListOutput` شناسه‌ی یکتا نمی‌دهد؛ شماره‌ی سفارش
           نزدیک‌ترین چیز است و همان هم لایسنس را به خریدش وصل می‌کند. */
        id: license.order_number ?? `row-${index}`,
        index: index + 1,
        orderNumber: license.order_number ?? '—',
        startsAt: formatJalaliDateTime(license.starts_at).date || '—',
        expiresAt: formatJalaliDateTime(license.expires_at).date || '—',
        limits: summarizeLimits(license.limits),
        status: license.is_active ? 'فعال' : 'غیرفعال',
    }
}

/**
 * لایسنس‌های کاربر جاری — `GET /license/`.
 *
 * کاربر از JWT شناخته می‌شود و هیچ شناسه‌ای در query نمی‌رود، پس این
 * هوک فقط «لایسنس‌های خودم» را می‌دهد.
 */
export function useLicenses() {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    /* تابع async داخل خود افکت تعریف می‌شود — `setLoading` همگام در
       بدنه‌ی افکت یک رندر آبشاری اضافه می‌سازد. */
    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } = await licenseService.getLicenses({
                    page,
                    limit: LICENSES_PER_PAGE,
                })
                if (cancelled) return

                const offset = (page - 1) * LICENSES_PER_PAGE
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
    }, [page, attempt])

    return { rows, page, pageCount, loading, error, setPage, reload }
}
