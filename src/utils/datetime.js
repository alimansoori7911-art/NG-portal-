import { format, newDate } from 'date-fns-jalali'

/**
 * قالب‌بندی تاریخ و ساعت به شمسی — مطابق فیگما.
 *
 * فیگما تاریخ و ساعت را در دو خط نشان می‌دهد:
 *   1404/4/21
 *   4:21:07
 *
 * ورودی رشته‌ی ISO از بک‌اند است (مثل session_started_at).
 * اگر مقدار نامعتبر بود، رشته‌ی خالی برمی‌گردد تا سلول جدول خالی بماند
 * به‌جای نمایش «Invalid Date».
 */
export function formatJalaliDateTime(iso) {
    if (!iso) return { date: '', time: '' }

    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return { date: '', time: '' }

    return {
        // بدون صفر ابتدایی، دقیقاً مثل فیگما: 1404/4/21
        date: format(d, 'yyyy/M/d'),
        time: format(d, 'H:mm:ss'),
    }
}

/**
 * تبدیل تاریخ شمسیِ تایپ‌شده به ISO برای ارسال به بک‌اند.
 *
 * ورودی مثل «۱۴۰۵/۰۵/۲۰» یا «1405-5-20». ارقام فارسی هم پذیرفته
 * می‌شود چون کاربر معمولاً با کیبورد فارسی تایپ می‌کند.
 *
 * مقدار نامعتبر null می‌دهد تا فراخوان تصمیم بگیرد (فیلد اختیاری
 * است و نباید ارسال یک تاریخ خراب کل درخواست را خراب کند).
 */
export function jalaliToISO(input) {
    if (!input) return null

    /* ارقام فارسی و عربی به لاتین */
    const latin = String(input)
        .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
        .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))

    const parts = latin.split(/[/\-.]/).map((p) => Number(p.trim()))
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null

    const [year, month, day] = parts
    if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1 || day > 31) {
        return null
    }

    try {
        /* ماه در date-fns از صفر شروع می‌شود */
        const d = newDate(year, month - 1, day)
        return Number.isNaN(d.getTime()) ? null : d.toISOString()
    } catch {
        return null
    }
}
