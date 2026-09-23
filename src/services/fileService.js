import axios from 'axios'
import api from './api'
import { tokenManager } from './tokenManager'

const unwrap = (res) => res.data?.data

/**
 * نمونه‌ی جدا برای آپلود — عمداً از `api` استفاده نمی‌شود.
 *
 * دو دلیل:
 *
 * ۱. `api` هدر `Content-Type: application/json` پیش‌فرض دارد. اگر
 *    آن را صریحاً override نکنیم، FormData هم با همان json فرستاده
 *    می‌شود و سرور بدنه را نمی‌تواند بخواند (تست شد: هدر واقعی روی
 *    سیم `application/json` می‌رفت). با instanceی که هدر پیش‌فرض
 *    ندارد، مرورگر خودش `multipart/form-data; boundary=…` می‌سازد.
 *
 * ۲. توکن آپلود **یک‌بارمصرف** است. اگر درخواست ۴۰۱ بگیرد،
 *    interceptorِ `api` آن را با توکن تازه دوباره می‌فرستد ولی
 *    `X-Upload-Token` دیگر سوخته و نتیجه ۴۰۹ می‌شود. اینجا تکرار
 *    خودکار نداریم.
 */
const uploadClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
})

/* چون این نمونه interceptorهای `api` را ندارد، خطایش هم نرمال نشده
   می‌آید. همان شکل `{ status, code, message }` ساخته می‌شود تا
   فراخوان‌ها لازم نباشد دو جور خطا را بشناسند. */
uploadClient.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error.response?.status ?? 0
        const body = error.response?.data
        const apiError = body?.data?.error ?? body?.error

        return Promise.reject({
            status,
            code: apiError?.code ?? 'UNKNOWN',
            message: apiError?.message || 'بارگذاری فایل ناموفق بود',
        })
    }
)

/* سقف حجم و نوع فایل — اسپک عددی نگفته، این‌ها قاعده‌ی سمت ما هستند
   تا کاربر قبل از آپلود بفهمد نه بعد از خطای ۴۱۳/۴۱۵ سرور. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const ACCEPTED_RECEIPT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
]

export const ACCEPT_ATTR = ACCEPTED_RECEIPT_TYPES.join(',')

/** پیام فارسی اگر فایل قابل قبول نباشد، وگرنه null */
export function validateFile(file) {
    if (!file) return 'فایلی انتخاب نشده است'
    if (!ACCEPTED_RECEIPT_TYPES.includes(file.type)) {
        return 'فقط تصویر (JPG، PNG، WebP) یا PDF پذیرفته می‌شود'
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        return 'حجم فایل باید کمتر از ۵ مگابایت باشد'
    }
    return null
}

/**
 * سرویس فایل — ماژول `files` بک‌اند.
 *
 * آپلود دو مرحله‌ای است:
 *   ۱. از اندپوینتِ مقصد یک توکن کوتاه‌عمر بگیر
 *      (`/orders/{id}/payments/attachments` یا معادل تیکت)
 *   ۲. فایل را با هدر `X-Upload-Token` به `/dl/upload` بفرست
 *
 * ⚠️ هر توکن **یک‌بارمصرف** است و فقط **یک فایل** می‌گیرد؛ برای چند
 * فایل باید چند بار توکن گرفت.
 */
export const fileService = {
    /**
     * POST /dl/upload — آپلود یک فایل با توکن.
     *
     * هم `Authorization` لازم است هم `X-Upload-Token` (اسپک صراحتاً
     * می‌گوید هر دو با هم). چون این درخواست از `api` نمی‌رود،
     * توکن دسترسی باید دستی گذاشته شود.
     *
     * Content-Type عمداً ست نمی‌شود تا مرورگر خودش boundary را بسازد.
     */
    upload(file, uploadToken, { onProgress } = {}) {
        const body = new FormData()
        body.append('file', file)

        const headers = { 'X-Upload-Token': uploadToken }
        const token = tokenManager.get()
        if (token) headers.Authorization = `Bearer ${token}`

        return uploadClient
            .post('/dl/upload', body, {
                headers,
                onUploadProgress: onProgress
                    ? (e) => {
                          if (!e.total) return
                          onProgress(Math.round((e.loaded * 100) / e.total))
                      }
                    : undefined,
            })
            .then(unwrap)
    },

    /**
     * POST /dl/{file_id} — گرفتن لینک دانلود موقت.
     *
     * ⚠️ با اینکه «خواندن» است، متدش در اسپک POST است نه GET.
     *
     * لینک presigned است و بعد از `expires_in` ثانیه (حدود یک ساعت)
     * منقضی می‌شود، پس نباید کش شود.
     */
    getDownload(fileId) {
        return api.post(`/dl/${fileId}`).then(unwrap)
    },

    /* میان‌بر: از شناسه‌ی فایل تا خودِ URL */
    getDownloadUrl(fileId) {
        if (!fileId) return Promise.resolve(null)
        return fileService
            .getDownload(fileId)
            .then((result) => result?.download_url ?? null)
    },
}
