import api from './api'

const unwrap = (res) => res.data?.data

/* وضعیت‌های سفارش — طبق enum بک‌اند (OrderStatus).
   برچسب فارسی برای نمایش در جدول. */
export const ORDER_STATUS = {
    REQUESTED: 'ثبت سفارش',
    AWAITING_ADMIN_REVIEW: 'در انتظار بررسی',
    QUOTATION_ISSUED: 'صدور پیش‌فاکتور',
    AWAITING_PAYMENT: 'در انتظار پرداخت',
    PAID_CONFIRMED: 'پرداخت تأیید شد',
    INVOICED: 'صدور فاکتور',
    TECHNICAL_IN_PROGRESS: 'ارجاع به تیم فنی',
    COMPLETED: 'تحویل محصول',
    CANCELED: 'لغو شده',
    REJECTED: 'رد شده',
}

export const statusLabel = (status) => ORDER_STATUS[status] ?? status ?? ''

/* روش‌های پرداخت — enum PaymentMethod */
export const PAYMENT_METHODS = {
    offline: 'آفلاین',
    cash: 'نقدی',
    bank_transfer: 'انتقال بانکی',
    card_to_card: 'کارت به کارت',
    other: 'سایر',
}

/**
 * سرویس سفارش‌ها — اندپوینت‌های کاربر (نه ادمین).
 * همه نیاز به لاگین دارند.
 *
 * پاسخ‌ها در قالب { data, meta } هستند و unwrap فقط data را برمی‌گرداند.
 * برای لیست، meta.pagination هم لازم است پس getOrders کل پاسخ را می‌دهد.
 */
export const orderService = {
    /* GET /orders/ — لیست سفارش‌های کاربر جاری.
       صفحه‌بندی: ?page=&limit= — پاسخ در meta.pagination
       (فیلدها: page, limit, total, total_pages, has_previous, has_next)

       برخلاف بقیه‌ی متدها کل پاسخ برگردانده می‌شود چون صفحه به
       اطلاعات صفحه‌بندی نیاز دارد. */
    getOrders({ page = 1, limit = 10, status, order_type } = {}) {
        return api
            .get('/orders/', { params: { page, limit, status, order_type } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /orders/{id} — جزئیات یک سفارش */
    getOrder(orderId) {
        return api.get(`/orders/${orderId}`).then(unwrap)
    },

    /* POST /orders/ — ثبت سفارش خرید.
       CreateOrder: هیچ فیلدی اجباری نیست ولی عملاً plan_id و
       plan_base_price_id لازم‌اند تا مشخص شود چه چیزی سفارش داده شده. */
    createOrder({
        plan_id,
        product_id,
        plan_base_price_id,
        quantity = 1,
        customer_note,
    }) {
        return api
            .post('/orders/', {
                order_type: 'purchase',
                plan_id,
                product_id,
                plan_base_price_id,
                quantity,
                customer_note,
            })
            .then(unwrap)
    },

    /* POST /orders/demo — درخواست دمو.
       همان ساختار CreateOrder ولی order_type اجباراً demo است. */
    requestDemo({ plan_id, product_id, plan_base_price_id, quantity = 1, customer_note }) {
        return api
            .post('/orders/demo', {
                order_type: 'demo',
                plan_id,
                product_id,
                plan_base_price_id,
                quantity,
                customer_note,
            })
            .then(unwrap)
    },

    /* POST /orders/{id}/cancel — لغو سفارش
       reason اختیاری است (حداکثر ۲۰۰۰ کاراکتر). */
    cancelOrder(orderId, reason) {
        return api.post(`/orders/${orderId}/cancel`, { reason }).then(unwrap)
    },

    /* POST /orders/{id}/payments — ثبت رسید پرداخت.
       amount اجباری و باید بزرگ‌تر از صفر باشد. */
    submitPayment(orderId, {
        amount,
        method = 'bank_transfer',
        currency = 'IRR',
        payer_name,
        tracking_number,
        receipt_ref,
        paid_at,
        note,
    }) {
        return api
            .post(`/orders/${orderId}/payments`, {
                amount,
                method,
                currency,
                payer_name,
                tracking_number,
                receipt_ref,
                paid_at,
                note,
            })
            .then(unwrap)
    },
}
