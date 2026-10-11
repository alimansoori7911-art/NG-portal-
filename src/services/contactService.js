import api from './api'

const unwrap = (res) => res.data?.data

/**
 * سرویس بخش عمومی سایت (landing).
 * فقط دو اندپوینت در OpenAPI فعلی موجود است.
 *
 * هر دو عمومی و POST هستند، پس طبق سند Turnstile توکن کپچا لازم دارند.
 * توکن از فرم می‌آید و در `config.captchaToken` به interceptor می‌رسد.
 */
export const contactService = {
    // POST /landing/contact — طبق ContactRequestInput، هر چهار فیلد اجباری
    submitRequest({ name, email, phone_number, message }, { captchaToken } = {}) {
        return api
            .post(
                '/landing/contact',
                { name, email, phone_number, message },
                { captchaToken }
            )
            .then(unwrap)
    },

    // POST /landing/subscribe — عضویت در خبرنامه
    subscribe(email, { captchaToken } = {}) {
        return api
            .post('/landing/subscribe', { email }, { captchaToken })
            .then(unwrap)
    },

    /**
     * GET /admin/landing/contacts — فهرست درخواست‌های تماس (ادمین).
     *
     * ✅ اسپک ۲۲ این را اضافه کرد. پیش از آن فقط نوشتن ممکن بود و
     * درخواست‌های ثبت‌شده از فرانت قابل خواندن نبود.
     *
     * ⚠️ فیلتر `q` عمومی ندارد؛ جستجو روی `name` و `email` جداگانه
     * است. شماره و متن پیام قابل جستجو نیستند.
     */
    listRequests({ page = 1, limit = 20, name, email } = {}) {
        return api
            .get('/admin/landing/contacts', {
                params: { page, limit, name: name || undefined, email: email || undefined },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    // GET /admin/landing/contacts/{id} — یک درخواست
    getRequest(contactId) {
        return api.get(`/admin/landing/contacts/${contactId}`).then(unwrap)
    },
}