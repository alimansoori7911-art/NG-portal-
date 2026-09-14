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
 * لایسنس‌های **کاربر جاری** — `GET /license/`.
 *
 * ⚠️ این هوک هیچ شناسه‌ای نمی‌فرستد: بک‌اند کاربر را از JWT می‌شناسد
 * و `user_id` را از query حذف کرد. پس نمی‌شود با آن لایسنس‌های کاربر
 * دیگری را دید — به همین دلیل از پروفایل جامع ادمین برداشته شد.
 *
 * فعلاً مصرف‌کننده‌ای ندارد و برای صفحه‌ی «لایسنس‌های من» در داشبورد
 * کاربر نگه داشته شده است.
 *
 * ⚠️ جایش زیر `modules/admin` مانده چون `ROWS_PER_PAGE` را از
 * `AdminTable` می‌گیرد. وقتی صفحه‌ی کاربر ساخته شد، همراهش به
 * `modules/dashboard` منتقل شود.
 *
 * @param enabled وقتی false است هیچ درخواستی نمی‌رود.
 */
export function useLicenses({ enabled = true } = {}) {
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
    }, [page, attempt, enabled])

    return { rows, page, pageCount, loading, error, setPage, reload }
}
