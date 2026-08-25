import { useState } from 'react'
import { X } from 'lucide-react'
import { formatToman, rialToToman, tomanToRial } from '../../../../utils/currency'
import styles from './QuoteForm.module.css'

/**
 * صدور پیش‌فاکتور — ادمین مبلغ نهایی سفارش را تعیین می‌کند.
 *
 * ورودی‌ها تومان‌اند و هنگام ارسال به ریال تبدیل می‌شوند، چون بک‌اند
 * همه‌جا ریال می‌گیرد.
 *
 * «قابل پرداخت» همین‌جا محاسبه و نشان داده می‌شود تا ادمین قبل از
 * ثبت ببیند کاربر چه مبلغی خواهد دید — نه اینکه بعداً غافلگیر شود.
 */
export default function QuoteForm({ order, busy, error, onSubmit, onClose }) {
    /* مقدار اولیه از snapshot سفارش می‌آید تا ادمین از صفر تایپ نکند */
    const [form, setForm] = useState({
        quoted: String(rialToToman(order.snapshot_total_amount) ?? ''),
        discount: '',
        tax: '',
        note: '',
    })

    const change = (key) => (e) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }))

    const num = (v) => {
        const n = Number(String(v).replace(/,/g, '').trim())
        return Number.isFinite(n) ? n : 0
    }

    const quotedToman = num(form.quoted)
    const payableToman = Math.max(
        0,
        quotedToman - num(form.discount) + num(form.tax)
    )

    const valid = quotedToman > 0

    const submit = (e) => {
        e.preventDefault()
        if (!valid || busy) return
        onSubmit({
            quoted_amount: tomanToRial(form.quoted),
            discount_amount: tomanToRial(form.discount || 0),
            tax_amount: tomanToRial(form.tax || 0),
            admin_note: form.note || undefined,
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

                <label className={styles.field}>
                    <span className={styles.label}>تخفیف (تومان)</span>
                    <input
                        className={styles.input}
                        inputMode="numeric"
                        value={form.discount}
                        onChange={change('discount')}
                        dir="ltr"
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>مالیات (تومان)</span>
                    <input
                        className={styles.input}
                        inputMode="numeric"
                        value={form.tax}
                        onChange={change('tax')}
                        dir="ltr"
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
