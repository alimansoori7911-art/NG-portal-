import { useCallback, useEffect, useState } from 'react'
import { orderService } from '../../../services/orderService'
import { sumRial, tomanToRial } from '../../../utils/currency'
import { jalaliToISO } from '../../../utils/datetime'

/**
 * سفارش + رسیدهای پرداختش.
 *
 * بک‌اند چند رسید برای یک سفارش را پشتیبانی می‌کند
 * (`OrderOutput.payments` آرایه است و verify هم payment_id جدا
 * می‌گیرد) — که با واقعیت می‌خواند چون مبلغ‌ها بالاست و ممکن است
 * از سقف روزانه‌ی کارت‌به‌کارت بیشتر شود.
 */
export function useOrderPayment(orderId) {
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)

    const load = useCallback(
        async ({ silent = false } = {}) => {
            if (!orderId) return
            if (!silent) setLoading(true)
            try {
                const data = await orderService.getOrder(orderId)
                setOrder(data)
                setError(null)
            } catch (err) {
                if (!silent) setError(err?.message || 'دریافت سفارش ناموفق بود')
            } finally {
                if (!silent) setLoading(false)
            }
        },
        [orderId]
    )

    useEffect(() => {
        load()
    }, [load])

    /**
     * ثبت رسید.
     *
     * ورودی فرم به **تومان** است ولی بک‌اند **ریال** می‌خواهد، پس
     * اینجا تبدیل می‌شود. بقیه‌ی فیلدها دست‌نخورده می‌روند.
     */
    const submitPayment = useCallback(
        async (form) => {
            setSubmitting(true)
            setSubmitError(null)
            try {
                await orderService.submitPayment(orderId, {
                    amount: tomanToRial(form.amount),
                    method: form.method,
                    payer_name: form.payerName || undefined,
                    tracking_number: form.trackingNumber || undefined,
                    receipt_ref: form.receiptRef || undefined,
                    /* کاربر شمسی تایپ می‌کند ولی بک‌اند ISO می‌خواهد.
                       تاریخ نامعتبر ارسال نمی‌شود چون فیلد اختیاری است. */
                    paid_at: jalaliToISO(form.paidAt) || undefined,
                    note: form.note || undefined,
                })
                /* سفارش دوباره خوانده می‌شود تا رسید تازه در فهرست
                   بیاید و «باقی‌مانده» به‌روز شود. */
                await load({ silent: true })
                return true
            } catch (err) {
                setSubmitError(err?.message || 'ثبت رسید ناموفق بود')
                return false
            } finally {
                setSubmitting(false)
            }
        },
        [orderId, load]
    )

    const payments = order?.payments ?? []

    /* فقط رسیدهای تأییدشده از «باقی‌مانده» کم می‌شوند؛ رسیدی که
       هنوز در انتظار بررسی است قطعی نیست و نباید حساب شود. */
    const verifiedRial = sumRial(payments.filter((p) => p.verified_at))
    const payableRial = Number(order?.payable_amount ?? 0)
    const remainingRial = Math.max(0, payableRial - verifiedRial)

    return {
        order,
        payments,
        loading,
        error,
        submitting,
        submitError,
        submitPayment,
        reload: load,
        payableRial,
        verifiedRial,
        remainingRial,
        isFullyPaid: payableRial > 0 && remainingRial === 0,
    }
}
