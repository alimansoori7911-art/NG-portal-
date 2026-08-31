/**
 * ساخت نام نمایشی از فیلدهای بک‌اند.
 *
 * اسپک ۱۵ به‌جای شناسه‌ی عددی، `first_name` و `last_name` را روی
 * `OrderOutput` و `PaymentRecordOutputAdmin` گذاشت. هر دو nullable
 * هستند، پس ممکن است یکی یا هیچ‌کدام پر نباشند.
 *
 * اگر هیچ نامی نبود `fallback` برمی‌گردد (پیش‌فرض خط تیره) — نه رشته‌ی
 * خالی که سلول جدول را بی‌دلیل خالی نشان دهد.
 */
export function fullName(source, fallback = '—') {
    if (!source) return fallback

    const name = [source.first_name, source.last_name]
        .filter((p) => p && String(p).trim())
        .join(' ')
        .trim()

    return name || fallback
}
