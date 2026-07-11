import api from "./api";

const unwrap = (res) => res.data?.data;

/**
 * تبدیل آرایه‌ی details بک‌اند به یک شیء { fieldName: message }
 * نمونه‌ی ورودی:
 *   [{ loc: "('phone_number',)", msg: "...", type: "..." }]
 * خروجی:
 *   { phone_number: "..." }
 */
export function parseValidationErrors(details = []) {
    const errors = {};
    details.forEach((d) => {
        // loc به شکل "('field_name',)" یا "('body', 'field_name')" است
        const match = d.loc?.match(/'([^']+)'\s*\)?\s*$/);
        const field = match?.[1];
        if (field) errors[field] = d.msg;
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

    // claim_token در body ارسال می‌شود (نه هدر)
    register(payload, claimToken) {
        return api
            .post("/auth/register", { ...payload, claim_token: claimToken })
            .then(unwrap);
    },

    requestOtp({ action, phone_number, email, username }) {
        return api
            .post("/auth/otp/request", { action, phone_number, email, username })
            .then(unwrap);
    },

    getOtpStatus(taskId) {
        return api.get(`/auth/otp/status/${taskId}`).then(unwrap);
    },

    verifyOtp({ action, otp, phone_number, email, username }) {
        return api
            .post("/auth/otp/verify", { action, otp, phone_number, email, username })
            .then(unwrap);
    },

    changeCredentials({ email, password, username }) {
        return api
            .post("/auth/password/change", { email, password, username })
            .then(unwrap);
    },

    resetPassword({ reset_token, new_password }) {
        return api
            .post("/auth/password/reset", { reset_token, new_password })
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