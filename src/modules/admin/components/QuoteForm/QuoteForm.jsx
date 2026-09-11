import { useState } from 'react'
import { X } from 'lucide-react'
import { formatToman, rialToToman, tomanToRial } from '../../../../utils/currency'
import styles from './QuoteForm.module.css'

/**
 * صدور پیش‌فاکتور — دو مرحله در یک فرم.
 *
 * فلوی بک‌اند:
 *   ۱. `POST /admin/plans/{plan_id}/prices` → ساخت `plan_price`
 *      برای **همان کاربر** و همان پلن
 *   ۲. `POST /admin/orders/{order_id}/quote` با `plan_price_id`
 *   → پیش‌فاکتور خودکار صادر می‌شود
 *
 * ادمین این دو مرحله را نمی‌بیند؛ یک فرم پر می‌کند و هر دو پشت سر هم
 * انجام می‌شوند.
 *
 * ⚠️ تخفیف و مالیات **درصد**اند نه مبلغ — بک‌اند
 * `discount_percentage` و `tax_percentage` می‌گیرد.
 */
export default function QuoteForm({
    order,
    termList = [],
    busy,
    error,
    onSubmit,
    onClose,
}) {
    const [form, setForm] = useState({
        /* مقدار اولیه از snapshot سفارش تا ادمین از صفر تایپ نکند */
        quoted: String(rialToToman(order.snapshot_total_amount) ?? ''),
        discountPct: '',
        taxPct: '',
        termCode: termList[0]?.code ?? '',
        note: '',
    })

    const change = (key) => (e) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }))

    const num = (v) => {
        const n = Number(String(v).replace(/,/g, '').trim())
        return Number.isFinite(n) ? n : 0
    }

    const quotedToman = num(form.quoted)
    const discountPct = num(form.discountPct)
    const taxPct = num(form.taxPct)

    /* همان فرمولی که بک‌اند اعمال می‌کند، تا ادمین قبل از ثبت ببیند
       کاربر چه مبلغی خواهد دید. */
    const afterDiscount = quotedToman * (1 - discountPct / 100)
    const payableToman = Math.max(0, Math.round(afterDiscount * (1 + taxPct / 100)))

    const pctValid = (p) => p >= 0 && p <= 100
    const valid =
        quotedToman > 0 &&
        pctValid(discountPct) &&
        pctValid(taxPct) &&
        Boolean(form.termCode)

    const submit = (e) => {
        e.preventDefault()
        if (!valid || busy) return
        onSubmit({
            quoted_amount: tomanToRial(form.quoted),
            discount_percentage: discountPct,
            tax_percentage: taxPct,
            term_code: form.termCode,
            admin_note: form.note || null,
        })
    }

    return (
        <form className={styles.wrapper} onSubmit={submit} noValidate>
            <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="بستن فرم"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <h2 className={styles.title}>صدور پیش‌فاکتور</h2>
            <p className={styles.subtitle}>
                سفارش <span dir="ltr">{order.order_number}</span>
                {order.snapshot_plan_name && ` · ${order.snapshot_plan_name}`}
            </p>

            <div className={styles.grid}>
                <label className={styles.field}>
                    <span className={styles.label}>مبلغ پایه (تومان) *</span>
                    <input
                        className={styles.input}
                        inputMode="numeric"
                        value={form.quoted}
                        onChange={change('quoted')}
                        dir="ltr"
                    />
                </label>

                {/* مدت اعتبار بخشی از هویت قیمت است، پس اینجا لازم است */}
                <label className={styles.field}>
                    <span className={styles.label}>مدت اعتبار *</span>
                    <select
                        className={styles.input}
                        value={form.termCode}
                        onChange={change('termCode')}
                    >
                        {termList.length === 0 && (
                            <option value="">مدتی تعریف نشده</option>
                        )}
                        {termList.map((t) => (
                            <option key={t.code} value={t.code}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>تخفیف (٪)</span>
                    <input
                        className={styles.input}
                        inputMode="numeric"
                        value={form.discountPct}
                        onChange={change('discountPct')}
                        dir="ltr"
                        placeholder="0"
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>مالیات (٪)</span>
                    <input
                        className={styles.input}
                        inputMode="numeric"
                        value={form.taxPct}
                        onChange={change('taxPct')}
                        dir="ltr"
                        placeholder="10"
                    />
                </label>

                <label className={`${styles.field} ${styles.fullWidth}`}>
                    <span className={styles.label}>یادداشت ادمین</span>
                    <textarea
                        className={styles.textarea}
                        rows={3}
                        value={form.note}
                        onChange={change('note')}
                    />
                </label>
            </div>

            {/* پیش‌نمایش مبلغی که کاربر خواهد دید */}
            <div className={styles.preview}>
                <span>مبلغ قابل پرداخت کاربر</span>
                <b className={styles.previewValue}>
                    {formatToman(tomanToRial(payableToman))}
                </b>
            </div>

            {termList.length === 0 && (
                <p className={styles.error} role="alert">
                    هیچ «مدت اعتبار»ی تعریف نشده است. اول از بخش محصولات
                    و کاتالوگ یکی بسازید.
                </p>
            )}

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <div className={styles.actions}>
                <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={!valid || busy}
                >
                    {busy ? 'در حال ثبت…' : 'صدور پیش‌فاکتور'}
                </button>
                <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={onClose}
                    disabled={busy}
                >
                    انصراف
                </button>
            </div>
        </form>
    )
}
