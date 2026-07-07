// authService.js
// ─────────────────────────────────────────────────────────────
// لایه‌ی سرویس: برای هر اندپوینت auth یک تابع تمیز.
//
// چرا این لایه؟
//  - کامپوننت‌ها نباید بدونن URLها چی هستن یا پاسخ چه شکلیه.
//  - اگر بک‌اند آدرسی رو عوض کرد، فقط همین یک فایل تغییر می‌کنه.
//  - همه‌ی پاسخ‌های سرور در قالب { data, meta } هستن؛ اینجا
//    فقط بخش data (محتوای اصلی) رو برمی‌گردونیم.
// ─────────────────────────────────────────────────────────────

import api from "./api";

// تابع کمکی: از پاسخ سرور فقط قسمت data رو درمیاره
const unwrap = (res) => res.data?.data;

export const authService = {
    // ── ورود و خروج ──────────────────────────────────────────
    // شناسه می‌تونه ایمیل، موبایل یا نام کاربری باشه؛
    // تشخیصش رو صفحه‌ی لاگین انجام میده و فیلد درست رو پاس میده.
    // خروجی: { access_token, user }
    login(credentials) {
        return api.post("/auth/login", credentials).then(unwrap);
    },

    logout() {
        return api.post("/auth/logout");
    },

    // کاربرِ نشستِ فعلی — خروجی: { created_at, identifiers, roles }
    getMe() {
        return api.get("/auth/me").then(unwrap);
    },

    // گرفتن Access Token جدید با کوکی رفرش — خروجی: { access_token }
    refresh() {
        return api.post("/auth/refresh").then(unwrap);
    },

    // ── ثبت‌نام ───────────────────────────────────────────────
    // ورودی: { email, username, phone_number, password }
    // خروجی: { access_token, user }
    register(payload) {
        return api.post("/auth/register", payload).then(unwrap);
    },

    // ── OTP ──────────────────────────────────────────────────
    // action یکی از این‌هاست: 'login' | 'register' | 'reset_password' | 'verify_contact'
    // خروجی (202): { message, otp? } — ارسال پیامک async است
    requestOtp({ action, phone_number, email, username }) {
        return api
            .post("/auth/otp/request", { action, phone_number, email, username })
            .then(unwrap);
    },

    // بررسی وضعیت ارسال پیامک/ایمیل (polling)
    // خروجی: { ready, status, task_id }
    getOtpStatus(taskId) {
        return api.get(`/auth/otp/status/${taskId}`).then(unwrap);
    },

    // خروجی بسته به action فرق می‌کنه:
    //  login  → { access_token, user }
    //  reset_password → { reset_token }
    //  register → { claim_token }
    verifyOtp({ action, otp, phone_number, email, username }) {
        return api
            .post("/auth/otp/verify", { action, otp, phone_number, email, username })
            .then(unwrap);
    },

    // ── رمز عبور ──────────────────────────────────────────────
    // تغییر رمز/ایمیل/نام‌کاربری وقتی کاربر لاگین است (هر فیلد اختیاری)
    changeCredentials({ email, password, username }) {
        return api
            .post("/auth/password/change", { email, password, username })
            .then(unwrap);
    },

    // مرحله‌ی آخر بازیابی رمز: reset_token از verifyOtp میاد
    resetPassword({ reset_token, new_password }) {
        return api
            .post("/auth/password/reset", { reset_token, new_password })
            .then(unwrap);
    },

    // ── مدیریت نشست‌ها ───────────────────────────────────────
    // خروجی: { sessions: [{ id, revoked, session_started_at }] }
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