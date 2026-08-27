// authStore.js
// ─────────────────────────────────────────────────────────────
// استور سراسری احراز هویت با Zustand.
//
// «وضعیت» (status) سه حالت داره:
//   'checking'      → اول لود اپ؛ هنوز نمی‌دونیم کاربر لاگینه یا نه
//   'authenticated' → کاربر لاگین است
//   'guest'         → کاربر لاگین نیست
//
// چرا status به‌جای یک boolean ساده؟
// چون موقع لود اولیه یک حالت سوم داریم («در حال بررسی») و اگر فقط
// true/false داشتیم، کاربرِ لاگین برای یک لحظه صفحه‌ی ورود رو می‌دید
// و بعد پرتاب می‌شد به داشبورد (پرش ناخوشایند UI).
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { authService } from "../services/authService";
import { tokenManager } from "../services/tokenManager";
// جلوگیری از اجرای موازی initialize.
// StrictMode در dev افکت‌ها را دوبار اجرا می‌کند؛ بدون این، دو درخواست
// همزمان /auth/refresh می‌رود که اگر بک‌اند refresh token را rotate کند،
// درخواست دوم نشست اول را باطل می‌کند و کاربر تصادفی خارج می‌شود.
let initPromise = null;

export const useAuthStore = create((set) => ({
    // ── State ──
    user: null,
    status: "checking",

    // ── Actions ──

    // بعد از login / register / verifyOtp موفق صدا زده میشه
    setAuth({ access_token, user }) {
        tokenManager.set(access_token);
        set({ user, status: "authenticated" });
    },

    // موقع لود اپ (یک‌بار در App.jsx) صدا زده میشه:
    // چون Access Token در حافظه‌ست و با رفرش صفحه پریده،
    // با کوکی HttpOnly یک توکن تازه می‌گیریم و کاربر رو لود می‌کنیم.
    async initialize() {
        if (initPromise) return initPromise;

        initPromise = (async () => {
            try {
                const { access_token } = await authService.refresh();
                tokenManager.set(access_token);
                const user = await authService.getMe();
                set({ user, status: "authenticated" });
            } catch {
                // کوکی نبود یا منقضی بود → کاربر مهمانه، اتفاق خاصی نیفتاده
                tokenManager.clear();
                set({ user: null, status: "guest" });
            }
        })().finally(() => {
            initPromise = null;
        });

        return initPromise;
    },

    /* تازه‌سازی اطلاعات کاربر از سرور — بعد از تأیید هویت لازم است
       تا نام و وضعیت is_verified در کل اپ (از جمله سایدبار) به‌روز شود. */
    async refreshUser() {
        const user = await authService.getMe();
        set({ user });
        return user;
    },

    async logout() {
        try {
            await authService.logout(); // به سرور خبر میدیم کوکی رو پاک کنه
        } catch {
            // حتی اگر سرور جواب نداد، سمت کلاینت خارج میشیم
        } finally {
            tokenManager.clear();
            set({ user: null, status: "guest" });
        }
    },

    // وقتی interceptor نتونست توکن رو رفرش کنه این صدا زده میشه
    sessionExpired() {
        tokenManager.clear();
        set({ user: null, status: "guest" });
    },
}));

// گوش‌دادن به eventی که api.js موقع انقضای کامل نشست می‌فرسته.
// (این خط باعث میشه بدون import حلقوی، استور از خطای 401 نهایی باخبر بشه)
window.addEventListener("auth:session-expired", () => {
    useAuthStore.getState().sessionExpired();
});

// ─────────────────────────────────────────────────────────────
// سلکتورهای کمکی
//
// اسپک جدید (Profile) به‌جای آرایه‌ی identifiers، فیلدهای نام‌دار دارد:
//   full_name / first_name / last_name  و  username|email|phone که هر
//   کدام یک شیء { value, is_verified, ... } هستند.
//
// ترتیب اولویت: نام کامل → نام و نام خانوادگی → نام کاربری → ایمیل → شماره.
// آرایه‌ی identifiers قدیمی به‌عنوان پشتیبان نگه داشته شده تا اگر بک‌اند
// هنوز پاسخ قدیمی می‌دهد، نام کاربر ناگهان خالی نشود.
// ─────────────────────────────────────────────────────────────
/**
 * مقدار یک شناسه‌ی کاربر — 'username' | 'email' | 'phone' | 'landline'.
 *
 * در اسپک جدید هر شناسه یک شیء { value, is_verified, ... } است، ولی
 * شکل قدیمی (آرایه‌ی identifiers با type/value) هم پشتیبانی می‌شود.
 *
 * 'phone' در شکل قدیمی 'phone_number' نام داشت.
 */
export function getIdentifier(user, type) {
    if (!user) return "";

    const direct = user[type];
    if (direct?.value) return direct.value;

    if (user.identifiers?.length) {
        const legacyType = type === "phone" ? "phone_number" : type;
        return (
            user.identifiers.find((i) => i.type === legacyType)?.value ?? ""
        );
    }

    return "";
}

export function getDisplayName(user) {
    if (!user) return "";

    const fullName =
        user.full_name?.trim() ||
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    if (fullName) return fullName;

    /* شناسه‌ها شیء‌اند نه رشته — گرفتن مستقیم user.email یک
       «[object Object]» روی سایدبار می‌گذاشت. getIdentifier هر دو
       شکل قدیم و جدید را می‌فهمد. */
    return (
        getIdentifier(user, "username") ||
        getIdentifier(user, "email") ||
        getIdentifier(user, "phone")
    );
}

export function hasRole(user, role) {
    return Boolean(user?.roles?.includes(role));
}