import { useState } from 'react'
import { X } from 'lucide-react'
import { identifierOf } from '../../../../services/adminUserService'
import styles from './UserEditForm.module.css'

/**
 * ویرایش اطلاعات یک کاربر توسط ادمین — `PATCH /admin/auth/users/{id}`.
 *
 * ⚠️ این دکمه در فیگما بود ولی پیاده نشده بود، چون در اسپک قدیمی
 * `UserUpdateSchema` فقط `is_active`/`is_blocked` می‌پذیرفت. اسپک
 * فعلی ۱۳ فیلد می‌پذیرد، پس حالا شدنی است.
 *
 * فقط فیلدهای تغییرکرده فرستاده می‌شوند: فرستادن مقدار بدون تغییر
 * بی‌ضرر است ولی لاگ ممیزی را شلوغ می‌کند.
 */
const FIELDS = [
    { key: 'first_name', label: 'نام' },
    { key: 'last_name', label: 'نام خانوادگی' },
    { key: 'username', label: 'نام کاربری', ltr: true },
    { key: 'email', label: 'ایمیل', ltr: true },
    { key: 'phone', label: 'شماره تماس', ltr: true },
    { key: 'national_id', label: 'کد ملی', ltr: true },
    { key: 'company_name', label: 'نام شرکت' },
    { key: 'position', label: 'سمت' },
    { key: 'company_address', label: 'آدرس شرکت' },
]

/* ارقام فارسی → لاتین برای فیلدهایی که سرور عدد می‌خواهد */
const toLatinDigits = (s) =>
    String(s ?? '')
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))

/* ⚠️ نام و تاریخ تولد روی خودِ کاربر نیستند:
   `UserResponseSchema` آن‌ها را ندارد و در `kyc_profile` می‌آیند.
   ارسال ولی روی خودِ کاربر انجام می‌شود (`UserUpdateSchema`). */
const initialOf = (user) => ({
    first_name: user?.first_name ?? user?.kyc_profile?.first_name ?? '',
    last_name: user?.last_name ?? user?.kyc_profile?.last_name ?? '',
    username: identifierOf(user, 'username'),
    email: identifierOf(user, 'email'),
    phone: identifierOf(user, 'phone'),
    national_id: user?.national_id ?? user?.kyc_profile?.national_id ?? '',
    company_name: user?.company_name ?? '',
    position: user?.position ?? '',
    company_address: user?.company_address ?? '',
})

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isValidPhone = (v) => /^(\+98|0)?9\d{9}$/.test(toLatinDigits(v).trim())

export default function UserEditForm({ user, saving = false, error, onSubmit, onClose }) {
    const [form, setForm] = useState(() => initialOf(user))
    const [errors, setErrors] = useState({})

    const change = (key) => (e) => {
        const v = e.target.value
        setForm((prev) => ({ ...prev, [key]: v }))
        setErrors((prev) => {
            if (!prev[key]) return prev
            const next = { ...prev }
            delete next[key]
            return next
        })
    }

    const submit = (e) => {
        e.preventDefault()

        const next = {}
        if (form.email.trim() && !isValidEmail(form.email)) {
            next.email = 'ایمیل معتبر نیست'
        }
        if (form.phone.trim() && !isValidPhone(form.phone)) {
            next.phone = 'شماره باید مثل 09121234567 باشد'
        }
        if (form.national_id.trim() && toLatinDigits(form.national_id).trim().length !== 10) {
            next.national_id = 'کد ملی باید ۱۰ رقم باشد'
        }
        if (Object.keys(next).length > 0) {
            setErrors(next)
            return
        }

        /* فقط چیزی که عوض شده */
        const initial = initialOf(user)

        const changes = {}
        for (const { key } of FIELDS) {
            const value =
                key === 'phone' || key === 'national_id'
                    ? toLatinDigits(form[key]).trim()
                    : form[key].trim()
            if (value !== String(initial[key] ?? '').trim()) changes[key] = value
        }

        onSubmit?.(changes)
    }

    const base = initialOf(user)
    const changedCount = FIELDS.filter(
        ({ key }) => form[key].trim() !== String(base[key] ?? '').trim()
    ).length

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

            <h3 className={styles.title}>ویرایش اطلاعات کاربر</h3>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <div className={styles.grid}>
                {FIELDS.map(({ key, label, ltr }) => (
                    <div key={key} className={styles.fieldWrapper}>
                        <label
                            className={`${styles.field} ${
                                errors[key] ? styles.fieldError : ''
                            }`}
                        >
                            <span className={styles.fieldLabel}>{label}</span>
                            <input
                                className={styles.fieldInput}
                                value={form[key]}
                                onChange={change(key)}
                                dir={ltr ? 'ltr' : undefined}
                                aria-invalid={Boolean(errors[key])}
                            />
                        </label>
                        {errors[key] && (
                            <p className={styles.errorText} role="alert">
                                {errors[key]}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <span className={styles.changeNote}>
                    {changedCount === 0
                        ? 'هنوز چیزی تغییر نکرده است'
                        : `${changedCount.toLocaleString('fa-IR')} فیلد تغییر کرده`}
                </span>

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose}>
                        انصراف
                    </button>
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={saving || changedCount === 0}
                    >
                        {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
                    </button>
                </div>
            </div>
        </form>
    )
}
