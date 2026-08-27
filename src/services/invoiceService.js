import api from './api'

const unwrap = (res) => res.data?.data

/* نوع سند — enum InvoiceType بک‌اند.
   همان تفکیکی که فلو می‌گفت: پیش‌فاکتور قبل از پرداخت، فاکتور بعد از آن. */
export const INVOICE_TYPE = {
    proforma: 'پیش‌فاکتور',
    invoice: 'فاکتور',
}

export const invoiceTypeLabel = (type) => INVOICE_TYPE[type] ?? type ?? ''

/* وضعیت سند — enum InvoiceStatus بک‌اند */
export const INVOICE_STATUS = {
    draft: 'پیش‌نویس',
    issued: 'صادر شده',
    sent: 'ارسال شده',
    paid: 'پرداخت شده',
    void: 'ابطال شده',
    cancelled: 'لغو شده',
}

export const invoiceStatusLabel = (status) =>
    INVOICE_STATUS[status] ?? status ?? ''

/* پاسخ لیست در اسپک هم آرایه‌ی ساده را می‌پذیرد هم آرایه‌ی تودرتو
   (anyOf روی data). تا وقتی کدام‌یک واقعاً برمی‌گردد معلوم شود، هر دو
   را تخت می‌کنیم؛ در غیر این صورت جدول ردیف‌های [object Object] می‌داد. */
const flatten = (data) => (Array.isArray(data) ? data.flat() : [])

/**
 * سرویس فاکتورها — ماژول invoices بک‌اند.
 *
 * فایل PDF مستقیم در پاسخ نیست: هر فاکتور فقط `pdf_file_id` دارد و
 * لینک دانلود جداگانه از ماژول files گرفته می‌شود. رجوع به getPdfUrl.
 */
export const invoiceService = {
    /* GET /invoice/ — فاکتورهای کاربر جاری.
       مثل بقیه‌ی لیست‌ها کل پاسخ برگردانده می‌شود چون صفحه به
       meta.pagination نیاز دارد. */
    getInvoices({ page = 1, limit = 10 } = {}) {
        return api.get('/invoice/', { params: { page, limit } }).then((res) => ({
            items: flatten(res.data?.data),
            pagination: res.data?.meta?.pagination ?? null,
        }))
    },

    /* GET /invoice/{id} — جزئیات یک فاکتور به‌همراه اقلام (items) */
    getInvoice(invoiceId) {
        return api.get(`/invoice/${invoiceId}`).then(unwrap)
    },

    /**
     * POST /dl/{file_id} — گرفتن لینک دانلود موقت فایل.
     *
     * ⚠️ با اینکه «خواندن» است، متدش در اسپک POST است نه GET.
     *
     * لینک برگشتی presigned S3 است و بعد از `expires_in` ثانیه (طبق
     * توضیح اسپک حدود یک ساعت) منقضی می‌شود. پس نباید ذخیره یا
     * کش شود — هر بار که کاربر خواست فاکتور را ببیند دوباره گرفته شود.
     */
    getFileDownload(fileId) {
        return api.post(`/dl/${fileId}`).then(unwrap)
    },

    /* میان‌بر: از شناسه‌ی فایل تا خودِ URL.
       اگر فاکتور هنوز PDF ندارد (pdf_file_id تهی است) null می‌دهد تا
       صفحه بتواند دکمه را غیرفعال کند به‌جای باز کردن تب خالی. */
    getPdfUrl(fileId) {
        if (!fileId) return Promise.resolve(null)
        return invoiceService
            .getFileDownload(fileId)
            .then((result) => result?.download_url ?? null)
    },
}
