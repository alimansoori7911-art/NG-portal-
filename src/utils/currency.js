/**
 * تبدیل و نمایش مبلغ.
 *
 * ⚠️ قاعده‌ی مهم پروژه:
 *   بک‌اند همه‌ی مبلغ‌ها را به **ریال** می‌دهد و می‌گیرد (snapshot_currency = IRR)
 *   ولی کاربر ایرانی **تومان** می‌بیند.
 *
 * پس تبدیل فقط در لایه‌ی نمایش انجام می‌شود و هر چیزی که به سمت
 * سرور می‌رود ریال می‌ماند.
 *
 * تقسیم دستی بر ۱۰ در کامپوننت‌ها ممنوع — اگر یک جا جا بیفتد کاربر
 * مبلغ را ده برابر اشتباه می‌بیند. همیشه از همین توابع استفاده شود.
 */

const RIAL_PER_TOMAN = 10

/* مبلغ‌های بک‌اند گاهی رشته‌اند (الگوی Money در اسپک هم number و هم
   string را می‌پذیرد) پس قبل از محاسبه نرمال می‌شوند. */
const toNumber = (value) => {
    if (value == null || value === '') return null
    const n = typeof value === 'number' ? value : Number(String(value).trim())
    return Number.isFinite(n) ? n : null
}

/** ریال → تومان (فقط عدد، بدون قالب‌بندی) */
export const rialToToman = (rial) => {
    const n = toNumber(rial)
    return n == null ? null : n / RIAL_PER_TOMAN
}

/** تومان → ریال — هنگام ارسال به بک‌اند */
export const tomanToRial = (toman) => {
    const n = toNumber(toman)
    return n == null ? null : Math.round(n * RIAL_PER_TOMAN)
}

/**
 * نمایش مبلغِ ریالیِ بک‌اند به‌صورت تومان با جداکننده‌ی فارسی.
 *
 *   formatToman(12535000)  →  «۱,۲۵۳,۵۰۰ تومان»
 *
 * مقدار نامعتبر رشته‌ی خالی می‌دهد تا در UI «NaN» دیده نشود.
 */
export function formatToman(rial, { withUnit = true } = {}) {
    const toman = rialToToman(rial)
    if (toman == null) return ''

    /* اعشار فقط وقتی نشان داده می‌شود که واقعاً وجود داشته باشد؛
       مبلغ‌های ریالی معمولاً مضرب ۱۰ هستند و اعشار نمی‌گیرند. */
    const text = toman.toLocaleString('fa-IR', { maximumFractionDigits: 2 })
    return withUnit ? `${text} تومان` : text
}

/** فقط عدد با جداکننده — برای جاهایی که واحد جدا نوشته می‌شود */
export const formatTomanNumber = (rial) => formatToman(rial, { withUnit: false })

/**
 * جمع مبلغ چند رکورد پرداخت (ریال).
 * ورودی آرایه‌ی PaymentRecordOutput است و خروجی ریال می‌ماند.
 */
export const sumRial = (records = [], pick = (r) => r.amount) =>
    records.reduce((total, r) => total + (toNumber(pick(r)) ?? 0), 0)
