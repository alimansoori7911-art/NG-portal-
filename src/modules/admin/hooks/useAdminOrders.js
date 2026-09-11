import { useCallback, useEffect, useState } from 'react'
import { adminOrderService, statusLabel } from '../../../services/orderService'
import { adminCatalogService } from '../../../services/adminCatalogService'
import { formatToman } from '../../../utils/currency'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { fullName } from '../../../utils/name'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/**
 * تبدیل OrderOutput به ردیف جدول فروش.
 *
 * ✅ ستون «خریدار» بالاخره نام واقعی است: اسپک ۱۵ فیلدهای
 * `first_name`/`last_name` را به `OrderOutput` اضافه کرد و
 * `user_id` را حذف کرد.
 *
 * مبلغ‌ها ریال می‌آیند و تومان نمایش داده می‌شوند.
 */
function toRow(order, i, offset) {
    const { date } = formatJalaliDateTime(order.created_at)

    return {
        id: order.id,
        index: offset + i + 1,
        orderCode: order.order_number,
        buyer: fullName(order),
        amount: formatToman(order.payable_amount ?? order.quoted_amount),
        paymentStatus: statusLabel(order.status),
        plan: order.snapshot_plan_name || order.snapshot_product_name || '—',
        date,
        /* داده‌ی خام برای نوار عملیات */
        raw: order,
    }
}

/**
 * سفارش‌های سیستم برای پنل ادمین — با صفحه‌بندی سمت سرور.
 */
export function useAdminOrders({ status } = {}) {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    /* با تغییر فیلتر به صفحه‌ی اول برمی‌گردیم وگرنه ممکن است روی
       صفحه‌ای بمانیم که در نتیجه‌ی جدید وجود ندارد. */
    useEffect(() => {
        setPage(1)
    }, [status])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } = await adminOrderService.getOrders({
                    page,
                    limit: ROWS_PER_PAGE,
                    status,
                })
                if (cancelled) return

                const offset = (page - 1) * ROWS_PER_PAGE
                setRows((items ?? []).map((o, i) => toRow(o, i, offset)))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت سفارش‌ها ناموفق بود')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, attempt, status])

    return { rows, page, pageCount, loading, error, setPage, reload }
}

/**
 * عملیات روی یک سفارش: صدور پیش‌فاکتور، تأیید رسید، تغییر وضعیت.
 *
 * از useAdminOrders جداست چون چرخه‌ی عمر متفاوتی دارد — لیست همیشه
 * هست ولی عملیات فقط وقتی ردیفی انتخاب شده.
 */
export function useOrderActions(onDone) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    /* هر سه عملیات الگوی یکسانی دارند، پس در یک تابع جمع شده‌اند
       تا مدیریت خطا و busy در سه جا تکرار نشود. */
    const run = useCallback(
        async (fn) => {
            setBusy(true)
            setError(null)
            try {
                await fn()
                onDone?.()
                return true
            } catch (err) {
                setError(err?.message || 'عملیات ناموفق بود')
                return false
            } finally {
                setBusy(false)
            }
        },
        [onDone]
    )

    return {
        busy,
        error,
        clearError: () => setError(null),

        /**
         * صدور پیش‌فاکتور — دو درخواست پشت سر هم.
         *
         * بک‌اند مبلغ را در `quote` نمی‌گیرد؛ اول باید یک
         * `plan_price` برای **کاربرِ همان سفارش** ساخته شود و بعد
         * شناسه‌اش به سفارش بچسبد. پیش‌فاکتور خودکار صادر می‌شود.
         */
        quote: (order, values) =>
            run(async () => {
                const planId = order.plan_id
                /* بدون این دو، ساخت قیمت ممکن نیست. خطای صریح بهتر از
                   ۴۲۲ مبهم بک‌اند است. */
                if (!planId) {
                    throw new Error('این سفارش پلن مشخصی ندارد')
                }

                /* ⚠️ اینجا به بک‌اند وابسته‌ایم و فعلاً کار نمی‌کند:
                   `CreatePlanPrice` فیلد `user_id` را **اجباری**
                   می‌خواهد (کاربر هدفِ قیمت)، ولی `OrderOutput` در
                   اسپک هیچ فیلد کاربری ندارد — نه `user_id` نه
                   `user_public_id`. فقط `first_name`/`last_name` دارد
                   که برای ساخت قیمت کافی نیست.

                   پس تا وقتی بک‌اند `user_id` را به `OrderOutput`
                   اضافه نکند، با خطای صریح متوقف می‌شویم نه با یک
                   ۴۲۲ مبهم. رجوع به BACKEND_REQUESTS.md */
                const userId = order.user_id ?? order.user?.id
                if (!userId) {
                    throw new Error(
                        'شناسه‌ی کاربرِ سفارش در پاسخ بک‌اند نیست، پس قیمت‌گذاری ممکن نشد. ' +
                            'بک‌اند باید user_id را به OrderOutput اضافه کند.'
                    )
                }

                /* قیمت روی (name, code, term_code, currency, user_id)
                   یکتاست. شماره‌ی سفارش در کد و نام می‌آید تا سفارش
                   بعدیِ همان کاربر با همان شرایط تداخل نکند. */
                const tag = order.order_number ?? order.id

                const price = await adminCatalogService.createPlanPrice(planId, {
                    code: `ORDER-${tag}`,
                    name: `سفارش ${tag}`,
                    term_code: values.term_code,
                    quoted_amount: values.quoted_amount,
                    discount_percentage: values.discount_percentage,
                    tax_percentage: values.tax_percentage,
                    user_id: userId,
                })

                if (!price?.id) {
                    throw new Error('ساخت قیمت انجام شد ولی شناسه‌ای برنگشت')
                }

                await adminOrderService.quote(order.id, {
                    plan_price_id: price.id,
                    admin_note: values.admin_note,
                })
            }),

        verifyPayment: (orderId, paymentId, note) =>
            run(() => adminOrderService.verifyPayment(orderId, paymentId, note)),

        changeStatus: (orderId, status, note) =>
            run(() => adminOrderService.changeStatus(orderId, status, note)),

        /* اتصال تیکت به سفارش — گره‌ی «Ticketing (optional, any stage)»
           در فلو. تا اسپک ۱۴ قابل استفاده نبود چون `ticket_id` عدد
           بود در حالی که تیکت‌ها UUID دارند. */
        linkTicket: (orderId, payload) =>
            run(() => adminOrderService.linkTicket(orderId, payload)),
    }
}
