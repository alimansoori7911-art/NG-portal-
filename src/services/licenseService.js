import api from './api'

const unwrap = (res) => res.data?.data

/**
 * سرویس لایسنس — اندپوینت‌های `/license/*`.
 *
 * هر دو مسیر **مالِ خودِ کاربر**اند و کاربر را از JWT می‌شناسند؛ هیچ
 * شناسه‌ای در query نمی‌رود.
 *
 * پنل ادمینِ لایسنس در این سیستم نیست (بک‌اند تأیید کرد لایسنس‌سرور
 * ابزار خودش را دارد)، پس تب لایسنس از صفحه‌ی فروش حذف شد.
 *
 * ⚠️ مسیرهای `/internal/license/*` عمداً اینجا نیستند: آن‌ها برای
 * گفت‌وگوی سرورِ لایسنس با بک‌اند است (رویداد، همگام‌سازی)، نه برای
 * پرتال. فرانت هرگز نباید آن‌ها را صدا بزند.
 */
export const licenseService = {
    /**
     * GET /license/ — لایسنس‌های **خودِ کاربر جاری**.
     *
     * کاربر از JWT شناخته می‌شود، پس هیچ شناسه‌ای در query نمی‌رود —
     * بک‌اند `user_id` را کلاً از این اندپوینت حذف کرد.
     *
     * `is_active`: تهی = همه، true = فعال‌ها، false = غیرفعال‌ها.
     */
    getLicenses({ page = 1, limit = 10, isActive } = {}) {
        return api
            .get('/license/', {
                params: { page, limit, is_active: isActive },
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
