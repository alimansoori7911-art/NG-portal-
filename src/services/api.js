// api.js
// ─────────────────────────────────────────────────────────────
// نمونه‌ی مرکزی Axios برای کل پروژه.
//
// چهار کار مهم اینجا انجام میشه:
//   ۱. ساخت instance با تنظیمات پایه (baseURL و ارسال کوکی‌ها)
//   ۲. Request Interceptor: چسباندن خودکار توکن + رفرش پیش‌دستانه
//   ۳. Response Interceptor: رفرش خودکار در صورت ۴۰۱
//   ۴. هماهنگی بین تب‌ها تا چند تب همزمان رفرش نکنند
// ─────────────────────────────────────────────────────────────

import axios from "axios";
import { tokenManager } from "./tokenManager.js";
import { localizeError } from "../constants/auth.js";

const baseURL = import.meta.env.VITE_API_BASE_URL;

/*
  بدون این، اگر `.env` نباشد `baseURL` می‌شود undefined و axios همه‌ی
  درخواست‌ها را به خود dev server می‌فرستد. جواب صفحه‌ی HTML است نه
  JSON، و خطاها به‌شکل گمراه‌کننده‌ای ظاهر می‌شوند («Unexpected token
  <») — انگار بک‌اند خراب است، در حالی که فقط فایل تنظیمات نیست.

  `.env` در گیت نیست (هر کس آدرس خودش را دارد)، پس این حالت برای هر
  کسی که تازه مخزن را clone می‌کند پیش می‌آید.
*/
if (!baseURL) {
    throw new Error(
        "VITE_API_BASE_URL تعریف نشده است. فایل .env را بساز: cp .env.example .env " +
            "و بعد npm run dev را ری‌استارت کن."
    );
}

/*
  اندپوینت‌های عمومی auth (طبق OpenAPI بلوک security ندارند).
  ۴۰۱ این‌ها یعنی «رمز یا کد اشتباه»، نه «توکن منقضی» — پس نباید
  رفرش و تکرار خودکار انجام شود.

  ⚠️ /auth/contact/verify عمداً در این لیست نیست: نیاز به لاگین دارد،
  پس ۴۰۱ آن واقعاً یعنی توکن منقضی شده و رفرش درست است.
  (اسپک برایش security ننوشته، ولی بک‌اند تأیید کرده که لازم است.)
*/
const PUBLIC_AUTH_ROUTES = [
    "/auth/login",
    "/auth/refresh",
    "/auth/register",
    "/auth/otp/request",
    "/auth/otp/verify",
    "/auth/otp/reset-password/verify",
    "/auth/password/reset",
];

const isPublicAuthRoute = (url = "") =>
    PUBLIC_AUTH_ROUTES.some((route) => url.includes(route));

const api = axios.create({
    baseURL,
    withCredentials: true, // 👈 حیاتی: بدون این، کوکی HttpOnly ارسال نمیشه
    headers: { "Content-Type": "application/json" },
});

/*
  instance خام و بدون interceptor، فقط برای درخواست رفرش.
  اگر از خود api استفاده می‌کردیم و رفرش ۴۰۱ می‌گرفت، interceptor
  دوباره فعال می‌شد و حلقه‌ی بازگشتی ایجاد می‌کرد.
*/
const refreshClient = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// ── هماهنگی بین تب‌ها ────────────────────────────────────────
// بک‌اند refresh token را rotate می‌کند؛ اگر دو تب همزمان رفرش کنند،
// دومی نشست اولی را باطل می‌کند. با این کانال، هر تب توکن تازه را
// به بقیه اعلام می‌کند تا آن‌ها درخواست تکراری نفرستند.
const channel =
    typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("auth-token")
        : null;

if (channel) {
    channel.onmessage = (event) => {
        if (event.data?.type === "token" && event.data.token) {
            tokenManager.set(event.data.token);
        }
        if (event.data?.type === "cleared") {
            tokenManager.clear();
        }
    };
}

function broadcastToken(token) {
    channel?.postMessage({ type: "token", token });
}

export function broadcastLogout() {
    channel?.postMessage({ type: "cleared" });
}

// ── رفرش با ددوپ ────────────────────────────────────────────
// اگر چند درخواست همزمان ۴۰۱ بگیرند، نباید چند بار /auth/refresh
// صدا زده بشه. با نگه‌داشتن «یک Promise مشترک»، همه منتظر همون
// یک رفرش می‌مونن.
let refreshPromise = null;

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = refreshClient
            .post("/auth/refresh")
            .then((res) => {
                const newToken = res.data?.data?.access_token;
                tokenManager.set(newToken);
                broadcastToken(newToken);
                return newToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

// ── ۱) Request Interceptor ──────────────────────────────────
api.interceptors.request.use(async (config) => {
    /*
      توکن دسترسی عمر کوتاهی دارد (۷ دقیقه). اگر منقضی شده باشد،
      به‌جای فرستادن درخواستِ محکوم‌به‌۴۰۱، همین‌جا پیش‌دستانه رفرش
      می‌کنیم. این یک رفت‌وبرگشت اضافه را حذف می‌کند.
    */
    if (
        !isPublicAuthRoute(config.url) &&
        tokenManager.get() &&
        tokenManager.isExpired()
    ) {
        try {
            await refreshAccessToken();
        } catch {
            // اگر شکست خورد، مسیر عادی ۴۰۱ در response interceptor ادامه می‌دهد
        }
    }

    const token = tokenManager.get();
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── ۲) Response Interceptor ─────────────────────────────────
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // شرایط تلاش برای رفرش:
        //  - خطا ۴۰۱ باشد
        //  - قبلاً برای همین درخواست رفرش نکرده باشیم (جلوگیری از حلقه)
        //  - اندپوینت عمومی نباشد (۴۰۱ آن‌ها واقعی است، نه انقضای توکن)
        const skipRefresh = isPublicAuthRoute(originalRequest?.url);

        if (status === 401 && originalRequest && !originalRequest._retry && !skipRefresh) {
            originalRequest._retry = true;
            try {
                await refreshAccessToken();
                return api(originalRequest); // 🔁 تکرار درخواست اصلی
            } catch {
                // رفرش هم شکست خورد → نشست واقعاً منقضی شده
                tokenManager.clear();
                broadcastLogout();
                window.dispatchEvent(new Event("auth:session-expired"));
            }
        }

        // ── نرمالایز کردن خطا ──
        // بک‌اند خطاها را در قالب { data: { error: {...} }, meta } می‌فرستد.
        // بعضی پاسخ‌ها error را یک لایه بالاتر می‌گذارند، پس هر دو چک می‌شود.
        const body = error.response?.data;
        const apiError = body?.data?.error ?? body?.error;
        const code = apiError?.code ?? "UNKNOWN";

        return Promise.reject({
            status: status ?? 0,
            code,
            /*
              پیام بک‌اند انگلیسی است؛ اگر برای کد، ترجمه‌ی فارسی داشته باشیم
              همان نمایش داده می‌شود. صفحه‌ها می‌توانند با خواندن code پیام
              دقیق‌تر خودشان را بگذارند.
            */
            message: status
                ? localizeError(code, apiError?.message)
                : "ارتباط با سرور برقرار نشد.",
            details: apiError?.details ?? null,
            // meta برای سیگنال‌هایی مثل redirect_to لازم است
            meta: body?.meta ?? null,
            retryAfter: Number(error.response?.headers?.["retry-after"]) || null,
        });
    }
);

export default api;