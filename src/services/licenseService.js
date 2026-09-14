import api from './api'

const unwrap = (res) => res.data?.data

/**
 * سرویس لایسنس — اندپوینت‌های `/license/*` (اسپک ۱۷).
 *
 * تا پیش از این هیچ اندپوینت لایسنسی در قرارداد نبود و تب لایسنس در
 * پنل ادمین زیر پوشش «به‌زودی» با جدول خالی می‌ماند.
 *
 * ⚠️ مسیرهای `/internal/license/*` عمداً اینجا نیستند: آن‌ها برای
 * گفت‌وگوی سرورِ لایسنس با بک‌اند است (رویداد، همگام‌سازی)، نه برای
 * پرتال. فرانت هرگز نباید آن‌ها را صدا بزند.
 */
export const licenseService = {
    /**
     * GET /license/ — لایسنس‌های کاربر.
     *
     * این اندپوینت **مالِ خودِ کاربر** است: کاربر را از JWT می‌شناسد،
     * پس بدون `user_id` هم کار می‌کند. (در اسپک ۱۸ اشتباهاً اجباری
     * علامت خورده بود؛ بک‌اند اصلاحش کرد.)
     *
     * `user_id` اختیاری فرستاده می‌شود تا اگر روزی ادمین بخواهد
     * لایسنس کاربر دیگری را ببیند، همین متد کار کند.
     *
     * ⚠️ فیلتر فعال/غیرفعال: نام پارامتر در اسپک ۱۸ `is_acitve` بود
     * (غلط املایی) و بک‌اند به `is_active` اصلاحش کرد. **هر دو**
     * فرستاده می‌شود چون نمی‌دانیم سروری که به آن وصلیم کدام نسخه
     * است؛ پارامتر ناشناخته بی‌صدا نادیده گرفته می‌شود، پس ضرری
     * ندارد و روی هر دو نسخه کار می‌کند.
     */
    getLicenses({ page = 1, limit = 10, user_id, isActive } = {}) {
        return api
            .get('/license/', {
                params: {
                    page,
                    limit,
                    user_id,
                    is_active: isActive,
                    is_acitve: isActive,
                },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /license/{id} — جزئیات یک لایسنس.
       برخلاف لیست، این `plan_type` و `is_pilot_mode` هم می‌دهد. */
    getLicense(licenseId) {
        return api.get(`/license/${licenseId}`).then(unwrap)
    },
}

/* سقف‌های لایسنس — کلیدهای `LicenseLimits` با برچسب فارسی.
   جدا نگه داشته شده تا صفحه‌ها ترتیب و نام یکسانی نشان دهند. */
export const LICENSE_LIMIT_LABELS = {
    max_assets: 'دارایی',
    max_discoveries: 'کشف',
    max_audits: 'ممیزی',
    max_hardens: 'سخت‌سازی',
    max_monitors: 'پایش',
}
