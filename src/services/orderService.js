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

/* نوع رابطه‌ی تیکت با سفارش — enum TicketRelationType.
   در فلو، `installation` مهم‌ترینشان است: پلن‌های install-by-us
   تیکت نصب خودکار می‌گیرند و همان‌جا پیگیری می‌شوند. */
export const TICKET_RELATION_TYPES = {
    technical: 'فنی',
    financial: 'مالی',
    general: 'عمومی',
    support: 'پشتیبانی',
    installation: 'نصب',
    delivery: 'تحویل',
}

export const relationTypeLabel = (type) =>
    TICKET_RELATION_TYPES[type] ?? type ?? ''

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

       ⚠️ قیمت اینجا نیست. کاربر فقط می‌گوید «چه پلنی از چه محصولی»؛
       قیمت‌گذاری بعداً توسط ادمین انجام می‌شود (رجوع به `quote`).
       فیلد `plan_base_price_id` قبلاً اشتباه فرستاده می‌شد — در این
       اندپوینت وجود ندارد. */
    createOrder({ plan_id, product_id, quantity = 1, customer_note }) {
        return api
            .post('/orders/', {
                order_type: 'purchase',
                product_id: product_id ?? null,
                plan_id: plan_id ?? null,
                quantity,
                customer_note: customer_note ?? null,
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

       ⚠️ در اسپک ۱۴ ساختار عوض شد: `amount` و `currency` از ورودی
       **حذف شدند** و جایشان `claimed_amount` آمد که اختیاری است.
       معنی‌اش هم فرق دارد — این «مبلغ ادعایی کاربر» است، نه مبلغ
       قطعی؛ مبلغ قطعی را ادمین هنگام تأیید تعیین می‌کند.

       در خروجی (`PaymentRecordOutput`) هر دو هستند: `claimed_amount`
       ادعای کاربر و `amount` مبلغ تأییدشده.

       سه فیلد جدید هم اضافه شد: bank_name، account_number و
       payer_national_id (پیش‌فرض کد ملی خود کاربر، مگر شخص دیگری
       پرداخت کرده باشد). */
    submitPayment(orderId, {
        claimed_amount,
        method = 'bank_transfer',
        payer_name,
        payer_national_id,
        bank_name,
        account_number,
        tracking_number,
        receipt_ref,
        paid_at,
        note,
    }) {
        return api
            .post(`/orders/${orderId}/payments`, {
                claimed_amount,
                method,
                payer_name,
                payer_national_id,
                bank_name,
                account_number,
                tracking_number,
                receipt_ref,
                paid_at,
                note,
            })
            .then(unwrap)
    },

    /* GET /orders/{id}/payments — رسیدهای یک سفارش با صفحه‌بندی.
       جدا از `OrderOutput.payments` است که همه را یک‌جا می‌دهد. */
    getOrderPayments(orderId, { page = 1, limit = 20 } = {}) {
        return api
            .get(`/orders/${orderId}/payments`, { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /orders/payments — همه‌ی پرداخت‌های کاربر جاری */
    getMyPayments({ page = 1, limit = 20 } = {}) {
        return api
            .get('/orders/payments', { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* POST /orders/{id}/payments/attachments — گرفتن توکن آپلود رسید.

       خروجی فقط یک JWT است؛ خود فایل بعداً با آن توکن به
       `/dl/upload` فرستاده می‌شود. هر توکن **یک‌بارمصرف** است و
       فقط یک فایل می‌گیرد. */
    requestPaymentUploadToken(orderId, payload = {}) {
        return api
            .post(`/orders/${orderId}/payments/attachments`, payload)
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

    /**
     * POST /admin/orders/{id}/quote — صدور پیش‌فاکتور.
     *
     * مبلغ **اینجا** فرستاده نمی‌شود: ادمین اول با
     * `POST /admin/plans/{plan_id}/prices` یک `plan_price` برای همان
     * کاربر و پلن می‌سازد، و اینجا فقط شناسه‌اش را می‌چسباند. خودِ
     * پیش‌فاکتور را بک‌اند به‌صورت خودکار صادر می‌کند.
     *
     * (نام قدیمی این موجودیت `plan_base_price` بود.)
     */
    quote(orderId, { plan_price_id, admin_note }) {
        return api
            .post(`/admin/orders/${orderId}/quote`, {
                plan_price_id,
                admin_note: admin_note ?? null,
            })
            .then(unwrap)
    },

    /* GET /admin/orders/payments — همه‌ی پرداخت‌های سیستم.

       خروجی `PaymentRecordOutputAdmin` است که برخلاف بقیه‌ی جدول‌های
       ادمین **نام کاربر** را هم می‌دهد (`user_full_name`)، نه فقط
       شناسه‌ی عددی. */
    getAllPayments({ page = 1, limit = 20 } = {}) {
        return api
            .get('/admin/orders/payments', { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* POST /admin/orders/{id}/payments/{pid}/verify — تأیید رسید.
       بعد از این، وضعیت سفارش به PAID_CONFIRMED می‌رود و طبق فلو
       فاکتور خودکار صادر می‌شود.

       ⚠️ در اسپک ۱۴ فیلد بدنه از `note` به `admin_note` تغییر نام داد. */
    verifyPayment(orderId, paymentId, admin_note) {
        return api
            .post(`/admin/orders/${orderId}/payments/${paymentId}/verify`, {
                admin_note,
            })
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
