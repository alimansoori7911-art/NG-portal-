import { useCallback, useEffect, useRef, useState } from 'react'
import {
    licenseService,
    ISSUANCE_PENDING_STATUSES,
} from '../../../services/licenseService'

/* هر چند ثانیه صف را دوباره بخوانیم وقتی چیزی ناتمام است */
const POLL_MS = 4000

/**
 * صف صدور لایسنس — فهرست، صدور جدید و تلاش دوباره.
 *
 * ⚠️ صدور **ناهمگام** است: `POST /admin/license/` با `202` و
 * `status = issuing` برمی‌گردد و کلید هنوز وجود ندارد. برای همین
 * این هوک تا وقتی ردیفی در `pending`/`issuing` هست خودش صف را
 * تازه می‌کند و به محض تمام‌شدن همه، poll را قطع می‌کند — وگرنه
 * یک تب باز تا ابد به سرور درخواست می‌زند.
 */
export function useLicenseIssuances({ status, source } = {}) {
    const [items, setItems] = useState([])
    const [pagination, setPagination] = useState(null)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)
    const [submitting, setSubmitting] = useState(false)

    /* فیلتر که عوض شد، صفحه باید به اول برگردد وگرنه ادمین روی
       صفحه‌ی ۳ از نتیجه‌ای می‌ماند که شاید یک صفحه بیشتر ندارد.

       این با «کلید فیلتر» حساب می‌شود نه با setState داخل افکت:
       آن کار یک رندر اضافه و یک درخواست دورریز می‌سازد، چون افکتِ
       واکشی اول با صفحه‌ی قدیمی می‌دود و بعد دوباره با ۱. */
    const filterKey = `${status ?? ''}|${source ?? ''}`
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
    let activePage = page
    if (prevFilterKey !== filterKey) {
        activePage = 1
        setPrevFilterKey(filterKey)
        setPage(1)
    }

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let alive = true
        /* عمداً اینجا setLoading(true) نیست: مقدار اولیه true است و
           در poll نباید جدول به حالت بارگذاری بپرد و چشمک بزند. */

        licenseService
            .getIssuances({ page: activePage, status, source })
            .then((res) => {
                if (!alive) return
                setItems(res.items)
                setPagination(res.pagination)
                setError(null)
            })
            .catch((err) => {
                if (!alive) return
                setError(err?.message || 'دریافت صف صدور ناموفق بود')
            })
            .finally(() => {
                if (alive) setLoading(false)
            })

        return () => {
            alive = false
        }
    }, [activePage, status, source, attempt])

    /* poll فقط وقتی چیزی ناتمام است.

       `reload` در deps نیست چون خودش باعث اجرای دوباره‌ی این افکت
       می‌شود و حلقه می‌سازد؛ با ref صدایش می‌زنیم. */
    const reloadRef = useRef(reload)
    useEffect(() => {
        reloadRef.current = reload
    }, [reload])

    const hasUnfinished = items.some((it) =>
        ISSUANCE_PENDING_STATUSES.includes(it.status)
    )

    useEffect(() => {
        if (!hasUnfinished) return
        const id = setInterval(() => reloadRef.current(), POLL_MS)
        return () => clearInterval(id)
    }, [hasUnfinished])

    /* صدور جدید. خطا را برمی‌گرداند تا فرم بتواند پیام را نشان دهد
       و مودال را باز نگه دارد. */
    const issue = useCallback(
        async (body) => {
            setSubmitting(true)
            try {
                await licenseService.requestLicense(body)
                reload()
                return { ok: true }
            } catch (err) {
                return {
                    ok: false,
                    message: err?.message || 'درخواست صدور ناموفق بود',
                }
            } finally {
                setSubmitting(false)
            }
        },
        [reload]
    )

    const retry = useCallback(
        async (issuanceId) => {
            try {
                await licenseService.retryIssuance(issuanceId)
                reload()
                return { ok: true }
            } catch (err) {
                return {
                    ok: false,
                    message: err?.message || 'تلاش دوباره ناموفق بود',
                }
            }
        },
        [reload]
    )

    return {
        items,
        pagination,
        page,
        setPage,
        loading,
        error,
        reload,
        issue,
        retry,
        submitting,
        polling: hasUnfinished,
    }
}
