import api from './api'

const unwrap = (res) => res.data?.data

/**
 * سلامت سرور — `GET /health`.
 *
 * عمومی است و توکن نمی‌خواهد. تنها گره‌ی فلو بود که وصل نشده بود.
 *
 * کاربردش تشخیص «سرور بالا هست ولی من لاگین نیستم» از «سرور اصلاً
 * جواب نمی‌دهد» است — دو حالتی که برای کاربر یکسان به نظر می‌رسند
 * ولی راه‌حلشان فرق دارد.
 */
export const healthService = {
    check() {
        return api.get('/health').then(unwrap)
    },

    /** true اگر سرور جواب داد، false اگر شبکه/سرور قطع بود */
    isUp() {
        return healthService
            .check()
            .then(() => true)
            .catch(() => false)
    },
}
