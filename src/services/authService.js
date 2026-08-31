import api from "./api";

const unwrap = (res) => res.data?.data;

/**
 * تبدیل details خطای ۴۲۲ به شیء { fieldName: message }
 *
 * بک‌اند loc را به‌صورت رشته می‌فرستد ("('phone_number',)" یا
 * "('body', 'email')") ولی حالت آرایه‌ای FastAPI (["body","email"]) هم
 * پشتیبانی می‌شود. بخش‌های پوششی مثل body/query نادیده گرفته می‌شوند
 * تا نام فیلد واقعی استخراج شود.
 */
const WRAPPER_KEYS = ["body", "query", "path", "header", "cookie"];

export function parseValidationErrors(details) {
    const errors = {};
    if (!details) return errors;

    const list = Array.isArray(details) ? details : [details];

    list.forEach((item) => {
        if (!item) return;

        const loc = item.loc ?? item.location ?? item.field;
        let field = null;

        if (Array.isArray(loc)) {
            const parts = loc.filter((p) => typeof p === "string");
            field = parts[parts.length - 1] ?? null;
        } else if (typeof loc === "string") {
            // تمام رشته‌های داخل کوتیشن را می‌گیرد و آخری را برمی‌دارد
            const found = [...loc.matchAll(/'([^']+)'/g)].map((m) => m[1]);
            field = found.length ? found[found.length - 1] : loc.trim() || null;
        }

        if (!field || WRAPPER_KEYS.includes(field)) return;

        const message = item.msg ?? item.message ?? "";
        if (message) errors[field] = message;
    });

    return errors;
}

export const authService = {
    login(credentials) {
        return api.post("/auth/login", credentials).then(unwrap);
    },

    logout() {
        return api.post("/auth/logout");
    },

    getMe() {
        return api.get("/auth/me").then(unwrap);
    },

    /* PATCH /auth/me — ویرایش پروفایل توسط خود کاربر (اسپک ۱۵).

       `UserProfilePatchSchema` شش فیلد دارد و همه اختیاری‌اند:
       first_name، last_name، birth_date، company_name، position،
       company_address.

       ⚠️ شناسه‌ها (ایمیل/شماره/نام کاربری) و کد ملی اینجا نیستند —
       آن‌ها فقط از راه تأیید هویت یا پنل ادمین عوض می‌شوند. */
    updateProfile(payload) {
        return api.patch("/auth/me", payload).then(unwrap);
    },

    refresh() {
        return api.post("/auth/refresh").then(unwrap);
    },

    /* RegisterInput هر چهار فیلد را اجباری می‌داند:
       username، email، password، phone_number */
    register(payload) {
        return api.post("/auth/register", payload).then(unwrap);
    },

    /* action یکی از: login | verify_contact | reset_password | register

       ⚠️ اندپوینت GET /auth/otp/status/{task_id} عمداً پیاده نشده:
       بک‌اند تأیید کرده که فقط برای trace کردن taskهای Celery در حالت
       debug است و به کلاینت مربوط نیست.
       به همین دلیل به فیلد otp در پاسخ هم نباید تکیه کرد — آن هم فقط
       در حالت debug پر می‌شود. */
    requestOtp({ action, phone_number, email, username }) {
        return api
            .post("/auth/otp/request", { action, phone_number, email, username })
            .then(unwrap);
    },

    verifyOtp({ action, otp, phone_number, email, username }) {
        return api
            .post("/auth/otp/verify", { action, otp, phone_number, email, username })
            .then(unwrap);
    },

    // اندپوینت اختصاصی بازیابی رمز — بک‌اند استفاده از این را توصیه کرده
    verifyResetOtp({ otp, phone_number, email, username }) {
        return api
            .post("/auth/otp/reset-password/verify", {
                action: "reset_password",
                otp,
                phone_number,
                email,
                username,
            })
            .then(unwrap);
    },

    /* POST /auth/contact/verify — تأیید هویت (کد ملی، نام، نام خانوادگی).
       نیازمند لاگین است (اسپک بلوک security ندارد ولی بک‌اند تأیید کرده).

       این تنها راهی است که کاربر می‌تواند اطلاعات پروفایلش را بنویسد؛
       اندپوینت ویرایش پروفایل وجود ندارد. فیلدهای VerifyIdentityInput
       دقیقاً روی Profile نگاشت می‌شوند.

       company_id از نوع string و اختیاری است (تأیید شده).
       national_id باید دقیقاً ۱۰ رقم باشد — الگوی ^\d{10}$ در اسپک.
       birth_date اختیاری و در قالب date است.

       فقط first_name، last_name و national_id اجباری‌اند؛ بقیه با
       undefined فرستاده نمی‌شوند تا مقدار قبلی را پاک نکنند. */
    verifyIdentity(payload) {
        return api.post("/auth/contact/verify", payload).then(unwrap);
    },

    /* ResetPasswordInput: { reset_token, new_password } — هر دو اجباری */
    resetPassword({ token, new_password }) {
        return api
            .post("/auth/password/reset", {
                reset_token: token,
                new_password,
            })
            .then(unwrap);
    },

    /* POST /auth/password/change — تغییر رمز کاربرِ واردشده.
       ChangedInput: { old_password, new_password } — هر دو اجباری.

       ⚠️ این متد قبلاً { email, password, username } می‌فرستاد که مربوط
       به اسپک قدیمی بود و دیگر پذیرفته نمی‌شود. رمز فعلی حالا واقعاً
       بررسی می‌شود، پس داشتن توکن به‌تنهایی برای تغییر رمز کافی نیست. */
    changePassword({ old_password, new_password }) {
        return api
            .post("/auth/password/change", { old_password, new_password })
            .then(unwrap);
    },

    /* GET /auth/sessions — نشست‌های فعال کاربر.

       در اسپک جدید خروجی از { sessions: [...] } به آرایه‌ی تخت تغییر
       کرد و صفحه‌بندی گرفت، پس مثل بقیه‌ی لیست‌ها کل پاسخ برگردانده
       می‌شود تا صفحه به meta.pagination دسترسی داشته باشد. */
    getSessions({ page = 1, limit = 10 } = {}) {
        return api
            .get("/auth/sessions", { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }));
    },

    removeSession(sessionId) {
        return api.delete(`/auth/sessions/${sessionId}`);
    },

    removeAllSessions() {
        return api.delete("/auth/sessions");
    },
};