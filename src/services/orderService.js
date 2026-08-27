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
    /* اسپک ۱۲ وضعیت دارد؛ این دو جا افتاده بودند و بدون آن‌ها
       کاربر کد خام انگلیسی می‌دید. */
    FAILED: 'ناموفق',
    REFUNDED: 'مسترد شده',
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

       ⚠️ `CreateDemoOrder` با `CreateOrder` یکی نیست: فیلد
       `plan_base_price_id` را **ندارد** (قیمت برای دمو بی‌معناست) و
       همه‌ی فیلدهایش اختیاری‌اند، پس درخواست خالی هم معتبر است.

       طبق فلو هر کاربر فقط **یک‌بار** می‌تواند دمو بگیرد و درخواست
       دوم خودکار رد می‌شود. */
    requestDemo({ plan_id, product_id, quantity = 1, customer_note } = {}) {
        return api
            .post('/orders/demo', {
                order_type: 'demo',
                plan_id,
                product_id,
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

/**
 * عملیات سفارش در پنل ادمین.
 *
 * این پنج اندپوینت با هم «حلقه‌ی گم‌شده»ی فلو بودند: بدون آن‌ها ادمین
 * نمی‌توانست سفارشی را از «بررسی» به «تکمیل» ببرد و صفحه‌ی پرداخت
 * کاربر هم عملاً بی‌فایده بود (کسی نبود پیش‌فاکتور صادر کند یا رسید
 * را تأیید کند).
 */
export const adminOrderService = {
    /* GET /admin/orders/ — همه‌ی سفارش‌های سیستم.
       فیلترها: status، order_type، user_id، product_id، plan_id،
       order_number — همه اختیاری. */
    getOrders({
        page = 1,
        limit = 10,
        status,
        order_type,
        user_id,
        order_number,
    } = {}) {
        return api
            .get('/admin/orders/', {
                params: { page, limit, status, order_type, user_id, order_number },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* POST /admin/orders/{id}/quote — صدور پیش‌فاکتور.
       فقط quoted_amount اجباری است؛ تخفیف و مالیات پیش‌فرض صفرند.

       ⚠️ فلو می‌گوید ادمین اول یک plan_base_price اختصاصی می‌سازد و
       بعد به سفارش می‌چسباند، ولی AdminPriceOrder چنین فیلدی ندارد
       و فقط مبلغ می‌گیرد. تفسیر ساده‌تر (مبلغ مستقیم) پیاده شده و
       تناقض در BACKEND_NEEDS.md ثبت شده است. */
    quote(orderId, { quoted_amount, discount_amount = 0, tax_amount = 0, admin_note }) {
        return api
            .post(`/admin/orders/${orderId}/quote`, {
                quoted_amount: String(quoted_amount),
                discount_amount: String(discount_amount),
                tax_amount: String(tax_amount),
                admin_note,
            })
            .then(unwrap)
    },

    /* POST /admin/orders/{id}/payments/{pid}/verify — تأیید رسید.
       بعد از این، وضعیت سفارش به PAID_CONFIRMED می‌رود و طبق فلو
       فاکتور خودکار صادر می‌شود. */
    verifyPayment(orderId, paymentId, note) {
        return api
            .post(`/admin/orders/${orderId}/payments/${paymentId}/verify`, { note })
            .then(unwrap)
    },

    /* POST /admin/orders/{id}/status — تغییر دستی وضعیت.
       برای رد کردن، شروع کار فنی، و تکمیل سفارش. */
    changeStatus(orderId, status, note) {
        return api
            .post(`/admin/orders/${orderId}/status`, { status, note })
            .then(unwrap)
    },

    /* POST /admin/orders/{id}/tickets/link — اتصال تیکت به سفارش.

       ⚠️ اسپک ticket_id را integer گرفته ولی همه‌جای دیگرِ تیکتینگ
       UUID است. تا روشن شدن، مقدار دست‌نخورده فرستاده می‌شود. */
    linkTicket(orderId, { ticket_id, relation_type = 'general', is_primary = false, note }) {
        return api
            .post(`/admin/orders/${orderId}/tickets/link`, {
                ticket_id,
                relation_type,
                is_primary,
                note,
            })
            .then(unwrap)
    },
}
