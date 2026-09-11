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

        /* ⚠️ `LoginOutput.user` از نوع `UserSchema` است و فقط `roles`
           و `created_at` دارد — نه `is_verified` و نه نام. آن‌ها فقط
           در `GET /auth/me` (شمای `Profile`) هستند.

           بدون این، گیتِ تأیید هویت فکر می‌کند کاربر تأیید نشده و
           همه را به صفحه‌ی وریفای می‌فرستد. پس بلافاصله پروفایل
           کامل را می‌گیریم. عمداً await نمی‌شود تا ورود کاربر معطل
           نماند؛ گیت تا رسیدنش صبر می‌کند.

           ⚠️ **ادغام** می‌شود نه جایگزینی: `Profile` فیلد `roles`
           ندارد، پس جایگزینیِ کامل نقش ادمین را پاک می‌کرد و ادمین
           بعد از لاگین به پنل راه نداشت. اگر روزی `/auth/me` هم
           `roles` برگرداند، مقدار تازه برنده می‌شود چون بعد از
           spread می‌آید. */
        authService
            .getMe()
            .then((profile) =>
                set((s) => ({ user: { ...s.user, ...profile } }))
            )
            .catch(() => {
                /* اگر نشد، `initialize` در لود بعدی جبرانش می‌کند */
            });
    },

    // موقع لود اپ (یک‌بار در App.jsx) صدا زده میشه:
    // چون Access Token در حافظه‌ست و با رفرش صفحه پریده،
    // با کوکی HttpOnly یک توکن تازه می‌گیریم و کاربر رو لود می‌کنیم.
    async initialize() {
        if (initPromise) return initPromise;

        /* بازدیدکننده‌ای که هرگز لاگین نکرده کوکی رفرش ندارد، پس
           زدن `POST /auth/refresh` فقط یک ۴۰۱ بی‌فایده می‌سازد و
           لود اول را کند می‌کند. مستقیم مهمان حسابش می‌کنیم. */
        if (!tokenManager.hadSession()) {
            set({ user: null, status: "guest" });
            return Promise.resolve();
        }

        initPromise = (async () => {
            try {
                const { access_token } = await authService.refresh();

                /* پاسخِ بدون توکن نباید «موفق» حساب شود، وگرنه
                   `set(undefined)` توکن را پاک می‌کند و کاربر بی‌دلیل
                   بیرون می‌افتد. */
                if (!access_token) {
                    throw new Error("refresh response had no access_token");
                }

                tokenManager.set(access_token);
                const user = await authService.getMe();

                /* منبع نقش‌ها `/auth/me` است — بک‌اند صریحاً گفت
                   نمی‌خواهد فرانت به JWT تکیه کند و خودش نقش‌ها را
                   در این پاسخ می‌گذارد.

                   JWT فقط **پشتیبان** است: چون شمای `Profile` در
                   اسپک ۱۵ فیلد `roles` را ندارد، اگر بک‌اندی که به
                   آن وصل هستیم قدیمی باشد، این خط جلوی پرت‌شدنِ
                   ادمین از پنل با هر رفرش صفحه را می‌گیرد
                   (`/auth/refresh` فقط access_token می‌دهد).

                   ترتیب اسپرد مهم است: `user` بعد می‌آید، پس اگر
                   پروفایل `roles` داشته باشد همان برنده می‌شود و
                   توکن نادیده گرفته می‌شود. */
                set({
                    user: { roles: tokenManager.rolesFromToken(), ...user },
                    status: "authenticated",
                });
            } catch (err) {
                /*
                  فقط ۴۰۱/۴۰۳ یعنی «کوکی رفرش باطل است» → مهمان.

                  ⚠️ قبلاً هر خطایی اینجا کاربر را مهمان می‌کرد و
                  `tokenManager.clear()` نشانه‌ی نشست را هم پاک
                  می‌کرد. یعنی یک قطعیِ لحظه‌ای شبکه یا ۵۰۰ سرور موقع
                  لود صفحه، کاربر را به صفحه‌ی ورود می‌فرستاد و چون
                  نشانه پاک شده بود، دفعه‌ی بعد هم اصلاً رفرش را
                  امتحان نمی‌کرد — کاربر دوباره رمز می‌خواست در حالی
                  که کوکی‌اش سالم بود.

                  در خطاهای گذرا نشانه دست‌نخورده می‌ماند تا لود بعدی
                  دوباره تلاش کند.
                */
                const status = err?.status ?? err?.response?.status;
                const rejectedByServer = status === 401 || status === 403;

                if (rejectedByServer) {
                    tokenManager.clear();
                } else {
                    /* توکنِ حافظه بی‌اعتبار است ولی نشانه می‌ماند */
                    tokenManager.set(null);
                }
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
        const profile = await authService.getMe();
        /* ادغام نه جایگزینی — به همان دلیل setAuth: `Profile` فیلد
           `roles` ندارد و جایگزینیِ کامل نقش را پاک می‌کند. */
        set((s) => ({ user: { ...s.user, ...profile } }));
        return profile;
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