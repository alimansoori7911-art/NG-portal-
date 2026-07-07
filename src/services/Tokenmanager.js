// tokenManager.js
// ─────────────────────────────────────────────────────────────
// نگهداری Access Token در «حافظه» (نه localStorage).
//
// چرا یک فایل جدا؟
// api.js برای هدر Authorization به توکن نیاز داره و authStore هم
// توکن رو مدیریت می‌کنه. اگر این دو مستقیم همدیگه رو import کنن،
// «وابستگی حلقوی» (Circular Dependency) پیش میاد. این فایل کوچک
// واسطه‌ی هر دوئه و مشکل رو حل می‌کنه.
//
// چرا localStorage نه؟
// اگر توکن در localStorage باشه، هر اسکریپت مخربی (حمله XSS) می‌تونه
// بخونتش. توی حافظه امن‌تره؛ با رفرش صفحه پاک میشه ولی مشکلی نیست،
// چون Refresh Token در کوکی HttpOnly هست و موقع لود اپ دوباره
// یک Access Token تازه می‌گیریم.
// ─────────────────────────────────────────────────────────────

let accessToken = null;

export const tokenManager = {
    get() {
        return accessToken;
    },
    set(token) {
        accessToken = token;
    },
    clear() {
        accessToken = null;
    },
};