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
import api, { broadcastLogout } from "../services/api";
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
// UserSchema فیلد «نام» نداره؛ اطلاعات داخل آرایه‌ی identifiers است:
//   [{ type: 'username', value: 'ali' }, { type: 'email', value: 'a@b.com' }]
// این تابع بهترین گزینه رو برای نمایش در هدر پیدا می‌کنه.
// ─────────────────────────────────────────────────────────────
export function getDisplayName(user) {
    if (!user?.identifiers?.length) return "";
    const byType = (t) => user.identifiers.find((i) => i.type === t)?.value;
    return byType("username") || byType("email") || byType("phone_number") || "";
}

export function hasRole(user, role) {
    return Boolean(user?.roles?.includes(role));
}