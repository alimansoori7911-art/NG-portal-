import { useCallback, useState } from 'react'
import { reportService } from '../../../services/reportService'

/* ماه جاری شمسی — بازه‌ی پیش‌فرضی که ادمین معمولاً می‌خواهد.
   از `Intl` استفاده می‌شود چون همان تقویمی را می‌دهد که بقیه‌ی
   پروژه نشان می‌دهد. */
function currentJalaliMonth() {
    const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date())

    const get = (t) => parts.find((p) => p.type === t)?.value ?? ''
    const y = get('year')
    const m = get('month')
    const d = get('day')

    return { from: `${y}/${m}/01`, to: `${y}/${m}/${d}` }
}

/* ارقام فارسی → لاتین، چون کاربر با کیبورد فارسی تایپ می‌کند ولی
   بک‌اند رقم لاتین می‌خواهد. */
const toLatinDigits = (s) =>
    String(s ?? '')
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))

/* الگوی تاریخ — هم شمسی (۱۴۰۴/۰۶/۰۱) هم میلادی (2025-08-23) مجازند */
const DATE_RE = /^(\d{4}\/\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}-\d{1,2})$/

/**
 * گزارش فروش — جمع تأییدشده و در انتظار در یک بازه.
 *
 * ✅ اسپک ۲۱. برخلاف کارت‌های قبلی که فقط جمعِ یک صفحه بودند، این
 * عدد **کل سیستم** در آن بازه است.
 *
 * درخواست فقط با فشردن دکمه می‌رود، نه با هر تغییر فیلد: بازه‌ی
 * نیمه‌تایپ‌شده یعنی درخواست بی‌معنا.
 */
export function useSalesReport() {
    const [range, setRange] = useState(currentJalaliMonth)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const setField = useCallback((key, value) => {
        setRange((prev) => ({ ...prev, [key]: value }))
        setError(null)
    }, [])

    const run = useCallback(async () => {
        const from = toLatinDigits(range.from).trim()
        const to = toLatinDigits(range.to).trim()

        if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
            setError('تاریخ را به شکل ۱۴۰۴/۰۶/۰۱ بنویسید')
            return
        }

        setLoading(true)
        setError(null)
        try {
            setData(await reportService.getSales({ from, to }))
        } catch (err) {
            setData(null)
            setError(err?.message || 'دریافت گزارش ناموفق بود')
        } finally {
            setLoading(false)
        }
    }, [range])

    return { range, setField, data, loading, error, run }
}
