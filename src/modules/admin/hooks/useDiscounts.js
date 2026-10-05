import { useCallback, useEffect, useState } from 'react'
import {
    discountService,
    discountTypeLabel,
    discountTargetLabel,
    discountState,
} from '../../../services/discountService'
import { formatToman } from '../../../utils/currency'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/* مقدار تخفیف — درصد و مبلغ شکل متفاوتی دارند و نباید یکسان
   نمایش داده شوند: «۱۰٪» در برابر «۱۰۰٬۰۰۰ تومان». */
function formatValue(d) {
    const raw = Number(d.value) || 0
    return d.discount_type === 'PERCENT'
        ? `${raw.toLocaleString('fa-IR')}٪`
        : formatToman(raw)
}

/* سقف مصرف — `max_usage` تهی یعنی نامحدود، نه صفر. */
function formatUsage(d) {
    const used = Number(d.used_count) || 0
    if (d.max_usage == null) return `${used.toLocaleString('fa-IR')} / نامحدود`
    return `${used.toLocaleString('fa-IR')} / ${Number(d.max_usage).toLocaleString('fa-IR')}`
}

function toRow(d, i, offset) {
    const { date } = formatJalaliDateTime(d.valid_until)

    return {
        id: d.id,
        index: offset + i + 1,
        code: d.code,
        type: discountTypeLabel(d.discount_type),
        value: formatValue(d),
        target: discountTargetLabel(d.target_type),
        usage: formatUsage(d),
        status: discountState(d),
        validUntil: date || '—',
        /* فرم ویرایش به فیلدهای خامی نیاز دارد که در ستون‌ها نیستند */
        raw: d,
    }
}

/**
 * کدهای تخفیف برای پنل ادمین — صفحه‌بندی سمت سرور.
 *
 * `include_expired` روی true است: ادمین باید کدهای منقضی را هم ببیند،
 * وگرنه کدی که دیروز منقضی شده بی‌سروصدا از فهرست غیب می‌شود و به‌نظر
 * می‌رسد پاک شده.
 */
export function useDiscounts() {
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
                const { items, pagination } = await discountService.getDiscounts({
                    page,
                    limit: ROWS_PER_PAGE,
                })
                if (cancelled) return

                const offset = (page - 1) * ROWS_PER_PAGE
                setRows((items ?? []).map((d, i) => toRow(d, i, offset)))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'دریافت کدهای تخفیف ناموفق بود')
                }
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

/**
 * ساخت، ویرایش و باطل کردن کد تخفیف.
 *
 * مثل بقیه‌ی هوک‌های عملیاتی پنل، از هوک فهرست جداست چون فقط وقتی
 * فرم باز است لازم می‌شود.
 */
export function useDiscountActions() {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    const run = useCallback(async (fn) => {
        setBusy(true)
        setError(null)
        try {
            await fn()
            return true
        } catch (err) {
            setError(err?.message || 'عملیات ناموفق بود')
            return false
        } finally {
            setBusy(false)
        }
    }, [])

    return {
        busy,
        error,
        clearError: () => setError(null),
        create: (data) => run(() => discountService.createDiscount(data)),
        update: (id, changes) =>
            run(() => discountService.updateDiscount(id, changes)),
        revoke: (id) => run(() => discountService.revokeDiscount(id)),
    }
}
