import { format } from 'date-fns-jalali'

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
