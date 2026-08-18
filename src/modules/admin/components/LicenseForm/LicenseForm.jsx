import { useState } from 'react'
import { X } from 'lucide-react'
import styles from './LicenseForm.module.css'

/**
 * فرم ایجاد لایسنس — مطابق tab222.svg.
 *
 * اعداد از SVG:
 *   عنوان «ایجاد لایسنس» ۱۳۹×۳۸ در y=292
 *   ردیف اول: دو فیلد ۴۲۳×۶۳ در x=630.5 (کد لایسنس) و x=134.5 (نام کاربری)
 *   ردیف دوم: یک فیلد ۴۲۳×۶۳ در x=630.5 (آدرس سرور) — ستون چپ خالی است
 *   دکمه‌ها در y=602: «ایجاد لایسنس» ۱۳۹×۴۰ و
 *                     «ایجاد به همراه فعال سازی لایسنس» ۲۷۳×۴۰
 *
 * حالت خطا: حاشیه‌ی فیلد #660000 و پیام قرمز زیر آن.
 * در فیگما نمونه‌اش روی «نام کاربری» است با پیام
 * «این نام کاربری در سیستم موجود نمی باشد».
 */
export default function LicenseForm({
    saving = false,
    fieldErrors = {},
    onSubmit,
    onClose,
    onFieldChange,
}) {
    const [form, setForm] = useState({
        licenseCode: '',
        username: '',
        server: '',
    })

    /* با تایپ در فیلدی که خطا دارد، خطایش پاک می‌شود — وگرنه کاربر
       مقدار درست را وارد می‌کند ولی همچنان پیام قرمز را می‌بیند. */
    const change = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }))
        if (fieldErrors[key]) onFieldChange?.(key)
    }

    /* withActivation مشخص می‌کند کدام دکمه زده شده — بک‌اند بعداً
       باید دو حالت را تفکیک کند. */
    const submit = (withActivation) => (e) => {
        e.preventDefault()
        onSubmit?.(form, { withActivation })
    }

    return (
        <form className={styles.wrapper} onSubmit={submit(false)} noValidate>
            <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="بستن فرم"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <div className={styles.divider} />

            <h2 className={styles.title}>ایجاد لایسنس</h2>

            {/* دو ستونه — در RTL ستون راست اول می‌آید.
                ردیف دوم فقط ستون راست را پر می‌کند (مطابق فیگما). */}
            <div className={styles.grid}>
                <Field
                    label="کد لایسنس"
                    value={form.licenseCode}
                    onChange={change('licenseCode')}
                    error={fieldErrors.licenseCode}
                    ltr
                />
                <Field
                    label="نام کاربری"
                    value={form.username}
                    onChange={change('username')}
                    error={fieldErrors.username}
                    ltr
                />
                <Field
                    label="آدرس سرور متصل"
                    value={form.server}
                    onChange={change('server')}
                    error={fieldErrors.server}
                    ltr
                />
            </div>

            {/* در RTL اولین فرزند سمت راست می‌نشیند؛ فیگما
                «ایجاد به همراه فعال سازی» را سمت راست گذاشته. */}
            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.activateBtn}
                    onClick={submit(true)}
                    disabled={saving}
                >
                    ایجاد به همراه فعال سازی لایسنس
                </button>
                <button type="submit" className={styles.createBtn} disabled={saving}>
                    {saving ? 'در حال ثبت…' : 'ایجاد لایسنس'}
                </button>
            </div>
        </form>
    )
}

/* برچسب داخل کادر بالا، مقدار زیرش — و در حالت خطا حاشیه‌ی قرمز
   با پیام زیر فیلد. */
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
