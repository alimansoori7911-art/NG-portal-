import api from './api'

const unwrap = (res) => res.data?.data

/**
 * سلامت سرور.
 *
 * ⚠️ در اسپک ۱۵ اندپوینت `GET /health` **حذف شد** و جایش دو تا آمد:
 *   - `/health/live`  → فقط «پروسه بالاست؟»
 *   - `/health/ready` → «بالاست **و** به DB/Redis وصل است؟»
 *
 * `ready` استفاده می‌شود نه `live`: کاربردِ ما تشخیص «سرور جواب
 * نمی‌دهد» از «اینترنت کاربر قطع است» در صفحه‌ی ورود است، و سروری
 * که پروسه‌اش بالاست ولی دیتابیس ندارد هم نمی‌تواند لاگین کند —
 * پس برای کاربر فرقی با خوابیدن سرور ندارد.
 *
 * عمومی است و توکن نمی‌خواهد.
 */
export const healthService = {
    check() {
        return api.get('/health/ready').then(unwrap)
    },

    /** فقط زنده بودن پروسه — بدون بررسی وابستگی‌ها */
    live() {
        return api.get('/health/live').then(unwrap)
    },

    /** true اگر سرور جواب داد، false اگر شبکه/سرور قطع بود */
    isUp() {
        return healthService
            .check()
            .then(() => true)
            .catch(() => false)
    },
}
