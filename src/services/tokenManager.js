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

/*
  نشانه‌ی «این مرورگر قبلاً لاگین کرده».

  خودِ refresh-token در کوکی HttpOnly است و جاوااسکریپت نمی‌تواند
  ببیندش، پس راهی نداریم بفهمیم کوکی هست یا نه. بدون این نشانه،
  اپ در هر بار باز شدن یک `POST /auth/refresh` می‌زند — حتی برای
  بازدیدکننده‌ای که اصلاً حساب ندارد. نتیجه: یک ۴۰۱ بی‌دلیل در
  کنسول و یک رفت‌وبرگشت اضافه در هر لود صفحه.

  این فقط یک راهنماست نه اعتبارسنجی؛ امنیت همچنان به کوکی HttpOnly
  و بک‌اند وابسته است. حتی اگر کاربر دستکاری‌اش کند، بدترین اتفاق
  یک درخواست رفرشِ ناموفق است.

  localStorage استفاده می‌شود نه sessionStorage تا با بستن تب هم
  بماند — همان‌طور که خود کوکی می‌ماند.
*/
const SESSION_HINT_KEY = "ng_has_session";

const hadSession = {
    get() {
        try {
            return localStorage.getItem(SESSION_HINT_KEY) === "1";
        } catch {
            /* حالت ناشناس یا مسدود بودن استوریج — محتاطانه true تا
               کاربرِ واقعاً لاگین‌کرده از سیستم بیرون نیفتد. */
            return true;
        }
    },
    mark() {
        try {
            localStorage.setItem(SESSION_HINT_KEY, "1");
        } catch {
            /* بی‌اهمیت: فقط یک بهینه‌سازی است */
        }
    },
    clear() {
        try {
            localStorage.removeItem(SESSION_HINT_KEY);
        } catch {
            /* بی‌اهمیت */
        }
    },
};

/** باز کردن payload توکن JWT بدون کتابخانه‌ی جانبی */
function readPayload(token) {
    try {
        const payload = token.split(".")[1];
        return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
        return null;
    }
}

function readExpiry(token) {
    const p = readPayload(token);
    return typeof p?.exp === "number" ? p.exp * 1000 : 0;
}

export const tokenManager = {
    get() {
        return accessToken;
    },

    set(token) {
        accessToken = token ?? null;
        expiresAt = token ? readExpiry(token) : 0;
        if (token) hadSession.mark();
    },

    /** آیا این مرورگر قبلاً نشستی داشته؟ — رجوع به توضیح بالا */
    hadSession() {
        return hadSession.get();
    },

    /**
     * نقش‌های داخل توکن — **فقط به‌عنوان پشتیبان**.
     *
     * ⚠️ منبع اصلی `GET /auth/me` است. بک‌اند صریحاً گفت نمی‌خواهد
     * source of truth فرانت روی JWT باشد، و حق دارد: نقش داخل توکن
     * تا انقضایش کهنه می‌ماند.
     *
     * پس این تابع فقط یک تور نجات است برای حالتی که پروفایل
     * `roles` نداشته باشد (شمای `Profile` در اسپک ۱۵ ندارد). بدون
     * آن، ادمین با هر رفرش صفحه از پنل بیرون می‌افتاد چون
     * `/auth/refresh` جز access_token چیزی نمی‌دهد.
     *
     * وقتی `roles` در `Profile` اسپک شد، این را می‌شود حذف کرد.
     *
     * در هر حال این فقط برای **نمایش** است نه امنیت: اجازه‌ی واقعی
     * را بک‌اند در هر درخواست می‌سنجد، پس دستکاری توکن سمت کلاینت
     * چیزی نمی‌دهد جز صفحه‌ای که همه‌ی درخواست‌هایش ۴۰۳ می‌گیرند.
     *
     * چند نام رایج چک می‌شود چون قطعی نشده بک‌اند کدام را می‌گذارد
     * — و ممکن است هیچ‌کدام را نگذارد، که اشکالی ندارد.
     */
    rolesFromToken() {
        const p = readPayload(accessToken);
        const raw = p?.roles ?? p?.role ?? p?.scope ?? p?.scopes;
        if (Array.isArray(raw)) return raw.filter((r) => typeof r === "string");
        /* `scope` معمولاً رشته‌ی جدا شده با فاصله است */
        if (typeof raw === "string") return raw.split(/[\s,]+/).filter(Boolean);
        return [];
    },

    clear() {
        accessToken = null;
        expiresAt = 0;
        hadSession.clear();
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