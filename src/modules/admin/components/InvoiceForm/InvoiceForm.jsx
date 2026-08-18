import { useState } from 'react'
import { X } from 'lucide-react'
import styles from './InvoiceForm.module.css'

/**
 * فرم صدور فاکتور — مطابق tab222.svg.
 *
 * اعداد از SVG:
 *   عنوان «صدور فاکتور» ۱۲۶×۳۸ در y=292
 *   چهار فیلد ۴۲۳×۶۳ در دو ردیف:
 *     ردیف اول  y=392.5 — x=599.5 (شماره سریال) و x=103.5 (نوع پلن)
 *     ردیف دوم  y=520.5 — x=599.5 (شناسه پرداخت) و x=103.5 (شماره MK)
 *   دکمه «صدور فاکتور الکترونیکی» ۱۹۸×۴۰ در y=666
 *
 * فاصله‌ی افقی ستون‌ها ۷۳، گام عمودی ۱۲۸ — مثل فرم لایسنس.
 */
export default function InvoiceForm({
    saving = false,
    fieldErrors = {},
    onSubmit,
    onClose,
    onFieldChange,
}) {
    const [form, setForm] = useState({
        serial: '',
        planType: '',
        paymentId: '',
        mkNumber: '',
    })

    /* با تایپ در فیلدی که خطا دارد، خطایش پاک می‌شود */
    const change = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }))
        if (fieldErrors[key]) onFieldChange?.(key)
    }

    const submit = (e) => {
        e.preventDefault()
        onSubmit?.(form)
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

            <div className={styles.divider} />

            <h2 className={styles.title}>صدور فاکتور</h2>

            {/* دو ستونه — در RTL ستون راست اول می‌آید */}
            <div className={styles.grid}>
                <Field
                    label="شماره سریال فاکتور"
                    value={form.serial}
                    onChange={change('serial')}
                    error={fieldErrors.serial}
                    ltr
                />
                <Field
                    label="نوع پلن"
                    value={form.planType}
                    onChange={change('planType')}
                    error={fieldErrors.planType}
                    ltr
                />
                <Field
                    label="شناسه پرداخت"
                    value={form.paymentId}
                    onChange={change('paymentId')}
                    error={fieldErrors.paymentId}
                    ltr
                />
                <Field
                    label="شماره MK"
                    value={form.mkNumber}
                    onChange={change('mkNumber')}
                    error={fieldErrors.mkNumber}
                    ltr
                />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'در حال صدور…' : 'صدور فاکتور الکترونیکی'}
            </button>
        </form>
    )
}

/* برچسب داخل کادر بالا، مقدار زیرش — و در حالت خطا حاشیه‌ی قرمز */
function Field({ label, value, onChange, error, ltr = false }) {
    return (
        <div className={styles.fieldWrapper}>
            <label className={`${styles.field} ${error ? styles.fieldError : ''}`}>
                <span className={styles.fieldLabel}>{label}</span>
                <input
                    className={styles.fieldInput}
                    value={value}
                    onChange={onChange}
                    dir={ltr ? 'ltr' : undefined}
                    aria-invalid={Boolean(error)}
                />
            </label>
            {error && (
                <p className={styles.errorText} role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}
