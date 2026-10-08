import api from './api'

const unwrap = (res) => res.data?.data

/**
 * سرویس لایسنس — اندپوینت‌های `/license/*`.
 *
 * هر دو مسیر **مالِ خودِ کاربر**اند و کاربر را از JWT می‌شناسند؛ هیچ
 * شناسه‌ای در query نمی‌رود.
 *
 * ⚠️ این نظر عوض شد: قبلاً بک‌اند گفته بود لایسنس‌سرور ابزار ادمین
 * خودش را دارد و ما تب لایسنس را از صفحه‌ی فروش حذف کردیم. اسپک ۲۱
 * مسیرهای `/admin/license/*` را اضافه کرد، پس صدور از پرتال دوباره
 * ممکن است و تب برگشت.
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

    /**
     * POST /admin/license/ — درخواست صدور لایسنس از لایسنس‌سرور.
     *
     * ⚠️ **ناهمگام است.** پاسخ `202` می‌دهد با `status = issuing` و
     * هنوز هیچ کلیدی وجود ندارد؛ کارگر پس‌زمینه با لایسنس‌سرور حرف
     * می‌زند. برای گرفتن `license_key` باید صف را poll کرد. اگر
     * فرانت این را «ساخته شد» بخواند، ادمین دنبال کلیدی می‌گردد که
     * هنوز نیست.
     *
     * ⚠️ `user_id` اینجا **عددی** است، نه `public_id`. سفارش‌ها
     * UUID می‌گیرند و کد تخفیف هم UUID؛ این یکی فرق دارد.
     */
    requestLicense(body) {
        return api.post('/admin/license/', body).then(unwrap)
    },

    /* GET /admin/license/issuances — صف درخواست‌های صدور. */
    getIssuances({ page = 1, limit = 10, status, source, orderId } = {}) {
        return api
            .get('/admin/license/issuances', {
                params: { page, limit, status, source, order_id: orderId },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /admin/license/issuances/{id} — یک درخواست، برای poll. */
    getIssuance(issuanceId) {
        return api.get(`/admin/license/issuances/${issuanceId}`).then(unwrap)
    },

    /**
     * POST /admin/license/issuances/{id}/retry — تلاش دوباره.
     *
     * فقط روی درخواستی که `issued` نیست معنا دارد. اسپک می‌گوید
     * چندبار صدا زدنش امن است، چون کارگر ردیف را قفل می‌کند.
     */
    retryIssuance(issuanceId) {
        return api
            .post(`/admin/license/issuances/${issuanceId}/retry`)
            .then(unwrap)
    },

    /* GET /license/{id} — جزئیات یک لایسنس.
       برخلاف لیست، این `plan_type` و `is_pilot_mode` هم می‌دهد. */
    getLicense(licenseId) {
        return api.get(`/license/${licenseId}`).then(unwrap)
    },
}

/* وضعیت‌های صف صدور — `LicenseIssuanceStatus`.

   `pending` و `issuing` هر دو «هنوز تمام نشده»اند ولی یکی نیستند:
   issuing یعنی کارگر ردیف را برداشته. برای ادمین این تفاوت مهم است
   چون در حالت گیرکرده می‌گوید کار شروع شده یا نه. */
export const ISSUANCE_STATUS = {
    pending: 'در صف',
    issuing: 'در حال صدور',
    issued: 'صادر شد',
    failed: 'ناموفق',
}

/* منبع درخواست — دستی یا از روی سفارش */
export const ISSUANCE_SOURCE = {
    manual: 'دستی',
    order: 'از سفارش',
}

/* پلن‌های لایسنس‌سرور — `PlanType` */
export const LICENSE_PLAN_TYPES = {
    pilot: 'آزمایشی',
    basic1: 'پایه ۱',
    basic2: 'پایه ۲',
    basic3: 'پایه ۳',
    enterprise: 'سازمانی',
}

/* وضعیت‌هایی که هنوز تمام نشده‌اند — یعنی باید poll ادامه یابد */
export const ISSUANCE_PENDING_STATUSES = ['pending', 'issuing']

export const issuanceStatusLabel = (s) => ISSUANCE_STATUS[s] ?? s ?? ''
export const issuanceSourceLabel = (s) => ISSUANCE_SOURCE[s] ?? s ?? ''
export const licensePlanLabel = (p) => LICENSE_PLAN_TYPES[p] ?? p ?? ''

/* سقف‌های لایسنس — کلیدهای `LicenseLimits` با برچسب فارسی.
   جدا نگه داشته شده تا صفحه‌ها ترتیب و نام یکسانی نشان دهند. */
export const LICENSE_LIMIT_LABELS = {
    max_assets: 'دارایی',
    max_discoveries: 'کشف',
    max_audits: 'ممیزی',
    max_hardens: 'سخت‌سازی',
    max_monitors: 'پایش',
}
