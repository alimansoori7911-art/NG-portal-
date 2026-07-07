// api.js
// ─────────────────────────────────────────────────────────────
// نمونه‌ی مرکزی Axios برای کل پروژه.
//
// سه کار مهم اینجا انجام میشه:
//   ۱. ساخت instance با تنظیمات پایه (baseURL و ارسال کوکی‌ها)
//   ۲. Request Interceptor: چسباندن خودکار توکن به هدر هر درخواست
//   ۳. Response Interceptor: اگر جواب 401 بود، یک‌بار توکن رو
//      رفرش می‌کنه و درخواست ناموفق رو دوباره می‌فرسته.
// ─────────────────────────────────────────────────────────────

import axios from "axios";
import { tokenManager } from "./tokenManager";

// آدرس سرور از فایل .env خونده میشه (مثلاً: VITE_API_BASE_URL=http://localhost:8000)
// مزیتش اینه که برای dev و production فقط یک فایل env عوض میشه، نه کد.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true, // 👈 حیاتی: بدون این، کوکی HttpOnly رفرش‌توکن ارسال نمیشه
    headers: { "Content-Type": "application/json" },
});

// ── ۱) Request Interceptor ───────────────────────────────────
// قبل از «هر» درخواست اجرا میشه؛ اگر توکن داریم، به هدر اضافه می‌کنیم.
api.interceptors.request.use((config) => {
    const token = tokenManager.get();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── ۲) Response Interceptor + رفرش خودکار توکن ───────────────
// نکته: اگر چند درخواست هم‌زمان 401 بگیرن، نباید چند بار /auth/refresh
// صدا زده بشه. با نگه‌داشتن «یک Promise مشترک»، همه منتظر همون
// یک رفرش می‌مونن. (این الگو رو خوب یاد بگیر، خیلی پرکاربرده)
let refreshPromise = null;

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = api
            .post("/auth/refresh")
            .then((res) => {
                const newToken = res.data?.data?.access_token;
                tokenManager.set(newToken);
                return newToken;
            })
            .finally(() => {
                refreshPromise = null; // برای دفعه‌ی بعد آزادش می‌کنیم
            });
    }
    return refreshPromise;
}

api.interceptors.response.use(
    // جواب موفق → بدون تغییر رد میشه
    (response) => response,

    // جواب خطا → اینجا تصمیم می‌گیریم
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // شرایط تلاش برای رفرش:
        //  - خطا 401 باشه
        //  - قبلاً برای همین درخواست رفرش نکرده باشیم (جلوگیری از حلقه بی‌نهایت)
        //  - خودِ درخواست، login یا refresh نباشه (اونا 401 واقعی دارن)
        const isAuthRoute =
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/refresh");

        if (status === 401 && !originalRequest._retry && !isAuthRoute) {
            originalRequest._retry = true; // پرچم: این درخواست یک‌بار رفرش خورده
            try {
                await refreshAccessToken();
                return api(originalRequest); // 🔁 تکرار درخواست اصلی با توکن جدید
            } catch {
                // رفرش هم شکست خورد → یعنی نشست واقعاً منقضی شده
                tokenManager.clear();
                // به بقیه‌ی اپ خبر میدیم (authStore به این event گوش میده)
                window.dispatchEvent(new Event("auth:session-expired"));
            }
        }

        // ── نرمالایز کردن خطا ──
        // بک‌اند خطاها رو در قالب { data: { error: { code, message } } } می‌فرسته.
        // اینجا یک شیء تمیز می‌سازیم تا کامپوننت‌ها راحت error.message رو نشون بدن.
        const apiError = error.response?.data?.data?.error;
        return Promise.reject({
            status: status ?? 0,
            code: apiError?.code ?? "UNKNOWN",
            message:
                apiError?.message ??
                (status ? "خطایی رخ داد. لطفاً دوباره تلاش کنید." : "ارتباط با سرور برقرار نشد."),
            details: apiError?.details ?? null,
        });
    }
);

export default api;