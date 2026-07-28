// tokenManager.js
// ─────────────────────────────────────────────────────────────
// نگهداری Access Token در «حافظه» (نه localStorage).
//
// چرا یک فایل جدا؟
// api.js برای هدر Authorization به توکن نیاز داره و authStore هم
// توکن رو مدیریت می‌کنه. اگر این دو مستقیم همدیگه رو import کنن،
// «وابستگی حلقوی» پیش میاد. این فایل واسطه‌ی هر دوئه.
//
// چرا localStorage نه؟
// اگر توکن در localStorage باشه، هر اسکریپت مخربی (XSS) می‌تونه
// بخونتش. توی حافظه امن‌تره؛ با رفرش صفحه پاک میشه ولی مشکلی نیست،
// چون Refresh Token در کوکی HttpOnly هست.
// ─────────────────────────────────────────────────────────────

let accessToken = null;
let expiresAt = 0; // میلی‌ثانیه

/** خواندن exp از payload توکن JWT بدون کتابخانه‌ی جانبی */
function readExpiry(token) {
    try {
        const payload = token.split(".")[1];
        const json = JSON.parse(
            atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        );
        return typeof json.exp === "number" ? json.exp * 1000 : 0;
    } catch {
        return 0;
    }
}

export const tokenManager = {
    get() {
        return accessToken;
    },

    set(token) {
        accessToken = token ?? null;
        expiresAt = token ? readExpiry(token) : 0;
    },

    clear() {
        accessToken = null;
        expiresAt = 0;
    },

    /**
     * آیا توکن منقضی شده یا تا چند لحظه‌ی دیگر منقضی می‌شود؟
     * حاشیه‌ی امن ۱۰ ثانیه‌ای، هم‌راستا با AUTH__LEEWAY_SECONDS بک‌اند.
     * اگر exp قابل خواندن نبود، false برمی‌گردد تا رفتار قبلی حفظ شود.
     */
    isExpired(skewMs = 10_000) {
        if (!accessToken || !expiresAt) return false;
        return Date.now() + skewMs >= expiresAt;
    },
};