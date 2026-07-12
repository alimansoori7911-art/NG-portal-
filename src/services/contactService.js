import api from './api'

const unwrap = (res) => res.data?.data

/**
 * توجه: تنها اندپوینت موجود در OpenAPI فعلی POST /landing/contact است.
 * ساختار دقیق ورودی و اندپوینت لیست درخواست‌ها هنوز از بک‌اند تأیید نشده —
 * جزئیات در backend-notes-contact.txt آمده است.
 */
export const contactService = {
    // ورودی: { request_type, asset_count, description }
    // اطلاعات کاربر (نام، ایمیل، شماره) از توکن نشست سمت سرور خوانده می‌شود
    submitRequest(payload) {
        return api.post('/landing/contact', payload).then(unwrap)
    },

    // خروجی مورد انتظار: [{ id, date, request_type, status }]
    getMyRequests() {
        return api.get('/landing/contact/requests').then(unwrap)
    },
}