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

/*
  آخرین رفرشِ موفق، و کف فاصله‌ی بین دو رفرش.

  ⚠️ `POST /auth/refresh` روی سرور واقعی سقف **۱۵ درخواست در دقیقه**
  دارد (بقیه‌ی مسیرها ۱۵۰) — یعنی بک‌اند عمداً آن را تنگ گرفته.

  بدون این کف، هر ۴۰۱ یک رفرش می‌سازد: چند درخواست پشت‌سرهم که ۴۰۱
  بگیرند، سهمیه را در چند ثانیه می‌سوزانند و بعد خودِ رفرش ۴۲۹
  می‌گیرد. چون ۴۲۹ نه ۴۰۱ است نه ۴۰۳، نشست هم پاک نمی‌شد و کاربر در
  حالت نیمه‌واردشده گیر می‌کرد — همان «بعد چند دقیقه دسترسی‌ها از بین
  می‌رود».

  `_retry` فقط جلوی رفرشِ دومِ **همان درخواست** را می‌گیرد؛ درخواست
  بعدی دوباره از صفر شروع می‌کند. پس گاردِ زمانی لازم است.
*/
let lastRefreshAt = 0;
const MIN_REFRESH_GAP_MS = 5_000;

export async function refreshAccessToken({ force = false } = {}) {
    /* رفرشِ پشت‌سرهم بی‌فایده است: توکنِ تازه چند دقیقه عمر دارد، پس
       اگر همین الان یکی گرفته‌ایم، همان معتبر است. */
    if (!force && !refreshPromise && Date.now() - lastRefreshAt < MIN_REFRESH_GAP_MS) {
        const current = tokenManager.get();
        if (current) return current;
    }

    if (!refreshPromise) {
        refreshPromise = refreshClient
            .post("/auth/refresh")
            .then((res) => {
                /*
                  پاسخ در قالب { data: { access_token } } است، ولی
                  بعضی پاسخ‌ها یک لایه بالاتر می‌گذارندش. هر دو خوانده
                  می‌شود تا شکلِ متفاوت باعث خروج کاربر نشود.
                */
                const newToken =
                    res.data?.data?.access_token ?? res.data?.access_token;

                /*
                  ⚠️ حیاتی: بدون این بررسی، پاسخِ ۲۰۰ که توکن ندارد
                  باعث `tokenManager.set(undefined)` می‌شد — یعنی توکن
                  **پاک** می‌شد بی‌آنکه خطایی رخ دهد. بعد هر درخواست
                  ۴۰۱ می‌گرفت و چون `_retry` جلوی رفرش دوم را می‌گیرد،
                  کاربر بی‌دلیل بیرون انداخته می‌شد و دوباره رمز
                  می‌خواست — در حالی که رفرش‌توکن در کوکی سالم بود.

                  حالا این حالت یک شکستِ صریح است تا مسیر خطا
                  تصمیم بگیرد، نه اینکه بی‌صدا نشست را از بین ببرد.
                */
                if (!newToken) {
                    throw new Error("refresh response had no access_token");
                }

                tokenManager.set(newToken);
                lastRefreshAt = Date.now();
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

    /*
      ⚠️ به مسیرهای عمومیِ auth توکن چسبانده نمی‌شود.

      مهم‌ترینش `/auth/refresh` است: هویت آن درخواست **فقط** از روی
      کوکی HttpOnly تشخیص داده می‌شود. اگر access token را هم بفرستیم،
      بک‌اند همان را به‌جای رفرش‌توکن می‌بیند و رفرش شکست می‌خورد —
      دقیقاً باگی که گزارش شد.

      `isPublicAuthRoute` قبلاً فقط جلوی رفرشِ پیش‌دستانه را می‌گرفت،
      نه خودِ هدر را.
    */
    const token = tokenManager.get();
    if (token && !config.headers.Authorization && !isPublicAuthRoute(config.url)) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    /*
      کپچا: سرویس‌ها توکن را در `config.captchaToken` می‌گذارند و
      اینجا به هدر تبدیل می‌شود. عمداً اینجا خودکار توکن نمی‌گیریم —
      گرفتن توکن باید از دل تعامل کاربر با فرم بیاید، نه از یک
      interceptor که نمی‌داند کدام ویجت مال کدام فرم است.
    */
    if (config.captchaToken) {
        config.headers["X-Captcha-Token"] = config.captchaToken;
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
            } catch (refreshError) {
                /*
                  فقط وقتی خارج می‌کنیم که خودِ رفرش‌توکن رد شده باشد.

                  قبلاً **هر** شکستی کاربر را بیرون می‌انداخت: قطعیِ
                  لحظه‌ای شبکه، ۵۰۰ سرور، یا حتی تایم‌اوت. هیچ‌کدام
                  نمی‌گویند کوکی باطل است، ولی کاربر دوباره رمز
                  می‌خواست.

                  با ۴۰۱/۴۰۳ یعنی سرور صریحاً رفرش‌توکن را نپذیرفته —
                  آنجا خروج درست است. در بقیه‌ی حالت‌ها توکن دست‌نخورده
                  می‌ماند و درخواست بعدی دوباره شانس رفرش دارد.
                */
                const refreshStatus = refreshError?.response?.status;
                const rejectedByServer =
                    refreshStatus === 401 || refreshStatus === 403;

                /*
                  ۴۲۹ یعنی سهمیه‌ی رفرش تمام شده، نه اینکه کوکی باطل
                  باشد. کاربر نباید بیرون انداخته شود، ولی باید تا
                  پایان مهلت دست نگه داریم وگرنه هر درخواست بعدی
                  دوباره به دیوار می‌خورد و وضعیت طولانی‌تر می‌شود.
                */
                if (refreshStatus === 429) {
                    const retryAfterSec = Number(
                        refreshError?.response?.headers?.["retry-after"]
                    );
                    const waitMs = Number.isFinite(retryAfterSec)
                        ? retryAfterSec * 1000
                        : 60_000;
                    lastRefreshAt = Date.now() + waitMs - MIN_REFRESH_GAP_MS;
                }

                if (rejectedByServer) {
                    tokenManager.clear();
                    broadcastLogout();
                    window.dispatchEvent(new Event("auth:session-expired"));
                }
            }
        }

        // ── نرمالایز کردن خطا ──
        // بک‌اند خطاها را در قالب { data: { error: {...} }, meta } می‌فرستد.
        // بعضی پاسخ‌ها error را یک لایه بالاتر می‌گذارند، پس هر دو چک می‌شود.
        const body = error.response?.data;
        const rawError = body?.data?.error ?? body?.error;
        /*
          خطای کپچا شکل دیگری دارد: طبق سند Turnstile بک‌اند
          `{ error: "captcha_invalid" }` می‌فرستد — یعنی `error` خودش
          رشته است، نه شیئی با `code`. بقیه‌ی خطاها شیء هستند.
        */
        const apiError = typeof rawError === "string" ? null : rawError;
        const code =
            (typeof rawError === "string" ? rawError : apiError?.code) ??
            "UNKNOWN";

        return Promise.reject({
            status: status ?? 0,
            code,
            /*
              پیام بک‌اند انگلیسی است؛ اگر برای کد، ترجمه‌ی فارسی داشته باشیم
              همان نمایش داده می‌شود. صفحه‌ها می‌توانند با خواندن code پیام
              دقیق‌تر خودشان را بگذارند.
            */
            message: status
                ? localizeError(code, apiError?.message ?? body?.message)
                : "ارتباط با سرور برقرار نشد.",
            details: apiError?.details ?? null,
            // meta برای سیگنال‌هایی مثل redirect_to لازم است
            meta: body?.meta ?? null,
            retryAfter: Number(error.response?.headers?.["retry-after"]) || null,
        });
    }
);

export default api;