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

    refresh() {
        return api.post("/auth/refresh").then(unwrap);
    },

    /* RegisterInput هر چهار فیلد را اجباری می‌داند:
       username، email، password، phone_number */
    register(payload) {
        return api.post("/auth/register", payload).then(unwrap);
    },

    // action یکی از: login | verify_contact | reset_password | register
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
       TODO: نوع company_id مشخص نیست — فعلاً فقط اگر مقدار داشت فرستاده می‌شود. */
    verifyIdentity({ first_name, last_name, national_id, birth_date, company_id }) {
        return api
            .post("/auth/contact/verify", {
                first_name,
                last_name,
                national_id,
                birth_date,
                company_id,
            })
            .then(unwrap);
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

    changeCredentials({ email, password, username }) {
        return api
            .post("/auth/password/change", { email, password, username })
            .then(unwrap);
    },

    getSessions() {
        return api.get("/auth/sessions").then(unwrap);
    },

    removeSession(sessionId) {
        return api.delete(`/auth/sessions/${sessionId}`);
    },

    removeAllSessions() {
        return api.delete("/auth/sessions");
    },
};