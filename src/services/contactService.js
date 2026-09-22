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

    // TODO: اندپوینت لیست درخواست‌ها هنوز در بک‌اند وجود ندارد.
    // getMyRequests() { ... }
}