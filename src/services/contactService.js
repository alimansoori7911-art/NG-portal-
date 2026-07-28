import api from './api'

const unwrap = (res) => res.data?.data

/**
 * سرویس بخش عمومی سایت (landing).
 * فقط دو اندپوینت در OpenAPI فعلی موجود است.
 */
export const contactService = {
    // POST /landing/contact — طبق ContactRequestInput، هر چهار فیلد اجباری
    submitRequest({ name, email, phone_number, message }) {
        return api
            .post('/landing/contact', { name, email, phone_number, message })
            .then(unwrap)
    },

    // POST /landing/subscribe — عضویت در خبرنامه
    subscribe(email) {
        return api.post('/landing/subscribe', { email }).then(unwrap)
    },

    // TODO: اندپوینت لیست درخواست‌ها هنوز در بک‌اند وجود ندارد.
    // getMyRequests() { ... }
}