import { useCallback, useEffect, useState } from 'react'
import { orderService } from '../../../services/orderService'
import { useAuthStore } from '../../../store/authStore'
import { HTTP, MSG } from '../../../constants/auth'

/**
 * درخواست دمو — `POST /orders/demo`.
 *
 * طبق فلو (`flow.dot`) دمو **آزمایشی و فقط یک‌بار برای هر کاربر** است و
 * درخواست دوم خودکار رد می‌شود. تا حالا UI این را نمی‌گفت و کاربر فقط
 * بعد از رد شدن می‌فهمید.
 *
 * برای همین سفارش‌های نوع `demo` کاربر خوانده می‌شوند تا اگر از قبل
 * دمو گرفته، دکمه غیرفعال شود و دلیلش گفته شود — به‌جای فرستادن
 * درخواستی که حتماً رد می‌شود.
 */
export function useDemoRequest() {
    const status = useAuthStore((s) => s.status)
    const isAuthenticated = status === 'authenticated'

    const [existing, setExisting] = useState(null)
    const [checking, setChecking] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [created, setCreated] = useState(null)

    /* کاربر مهمان سفارشی ندارد؛ درخواست ۴۰۱ می‌گیرد پس اصلاً نمی‌زنیم.
       پاک کردن existing اینجا لازم نیست (و رندر آبشاری می‌سازد) چون
       خروجی زیر با isAuthenticated محافظت شده. */
    useEffect(() => {
        if (!isAuthenticated) return

        let cancelled = false
        setChecking(true)

        orderService
            .getOrders({ page: 1, limit: 1, order_type: 'demo' })
            .then(({ items }) => {
                if (!cancelled) setExisting(items?.[0] ?? null)
            })
            .catch(() => {
                /* اگر نشد، دکمه باز می‌ماند و بک‌اند تصمیم می‌گیرد —
                   بهتر از قفل کردن دکمه به‌خاطر یک خطای شبکه. */
                if (!cancelled) setExisting(null)
            })
            .finally(() => {
                if (!cancelled) setChecking(false)
            })

        return () => {
            cancelled = true
        }
    }, [isAuthenticated])

    const requestDemo = useCallback(async () => {
        setError(null)
        setSubmitting(true)
        try {
            const order = await orderService.requestDemo({})
            setCreated(order)
            setExisting(order)
            return order
        } catch (err) {
            /* ۴۰۰ اینجا یعنی «قبلاً دمو گرفته‌ای» — همان قاعده‌ای که
               فلو توصیف می‌کند. پیام خام بک‌اند انگلیسی است. */
            if (err.status === HTTP.BAD_REQUEST || err.status === HTTP.CONFLICT) {
                setError('شما قبلاً یک‌بار درخواست دمو ثبت کرده‌اید.')
            } else if (err.status === HTTP.TOO_MANY_REQUESTS) {
                setError(MSG.RATE_LIMIT)
            } else {
                setError(err?.message || MSG.GENERIC)
            }
            return null
        } finally {
            setSubmitting(false)
        }
    }, [])

    return {
        isAuthenticated,
        /* سفارش دموی قبلی، اگر وجود داشته باشد.
           با خروج کاربر، دموی حساب قبلی نباید دکمه را قفل نگه دارد. */
        existing: isAuthenticated ? existing : null,
        checking,
        submitting,
        error,
        created,
        requestDemo,
        dismiss: () => {
            setError(null)
            setCreated(null)
        },
    }
}
