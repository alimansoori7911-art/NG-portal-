import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import styles from './UserCreateForm.module.css'

/* شناسه‌هایی که فرم می‌گیرد.

   `IdentifierType` شش مقدار دارد ولی سه‌تای اول چیزی است که ادمین
   موقع ساخت کاربر لازم دارد؛ بقیه (`national_id`, `landline`,
   `economic_code`) بخشی از پروفایل هویتی‌اند نه ساخت حساب. */
const IDENTIFIERS = [
    { type: 'username', label: 'نام کاربری', placeholder: 'agent01', required: true },
    { type: 'email', label: 'ایمیل', placeholder: 'user@example.com' },
    { type: 'phone', label: 'شماره تماس', placeholder: '09121234567' },
]

/* همان الگویی که بقیه‌ی فرم‌های پروژه دارند — `+98` یا `0` هر دو. */
const PHONE_RE = /^(\+98|0)?9\d{9}$/

/**
 * ساخت کاربر از پنل ادمین.
 *
 * ⚠️ `UserCreateSchema` شناسه‌ها را **آرایه‌ای از `{type, value}`**
 * می‌گیرد، نه فیلدهای تخت. فرم آن‌ها را تخت نشان می‌دهد چون برای
 * ادمین خواناتر است، و موقع ارسال به آرایه تبدیل می‌کند.
 *
 * ⚠️ رمز عبور اینجا **ساخته می‌شود نه نمایش داده**: ادمین رمز اولیه را
 * می‌گذارد و کاربر بعداً خودش عوضش می‌کند. فرم رمز را جایی ذخیره
 * نمی‌کند و بعد از ارسال پاک می‌شود.
 */
export default function UserCreateForm({
    roles = [],
    busy = false,
    error = null,
    onSubmit,
    onClose,
}) {
    const [form, setForm] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        is_active: true,
        is_verified: false,
        role_id: '',
    })
    const [fieldErrors, setFieldErrors] = useState({})

    const set = (key) => (e) => {
        const value =
            e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm((p) => ({ ...p, [key]: value }))
        setFieldErrors((p) => {
            const n = { ...p }
            delete n[key]
            return n
        })
    }

    const submit = (e) => {
        e.preventDefault()

        const errs = {}
        if (!form.username.trim()) errs.username = 'نام کاربری الزامی است'
        /* اسپک حداقل طولی برای رمز نگذاشته، ولی رمز یک‌حرفی برای
           حسابی که ادمین می‌سازد بی‌معناست. */
        if (form.password.length < 8) errs.password = 'رمز عبور حداقل ۸ نویسه'

        if (form.email.trim() && !form.email.includes('@')) {
            errs.email = 'ایمیل معتبر نیست'
        }
        if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
            errs.phone = 'شماره تماس معتبر نیست'
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        /* فیلدهای تخت → آرایه‌ی `IdentifierCreateSchema` */
        const identifiers = IDENTIFIERS.filter((i) => form[i.type].trim()).map(
            (i) => ({
                type: i.type,
                value: form[i.type].trim(),
                /* ادمین خودش حساب را می‌سازد، پس شناسه فعال است */
                status: 'active',
                is_verified: form.is_verified,
            })
        )

        onSubmit?.({
            password: form.password,
            identifiers,
            is_active: form.is_active,
            is_verified: form.is_verified,
            role_ids: form.role_id ? [Number(form.role_id)] : [],
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

            <div className={styles.divider} />

            <h2 className={styles.title}>ساخت کاربر</h2>

            <div className={styles.body}>
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <div className={styles.row}>
                    {IDENTIFIERS.slice(0, 2).map((i) => (
                        <label
                            key={i.type}
                            className={`${styles.field} ${
                                fieldErrors[i.type] ? styles.fieldError : ''
                            }`}
                        >
                            <span className={styles.label}>
                                {fieldErrors[i.type] || i.label}
                                {i.required && <span className={styles.req}>*</span>}
                            </span>
                            <input
                                className={styles.input}
                                value={form[i.type]}
                                onChange={set(i.type)}
                                placeholder={i.placeholder}
                                dir="ltr"
                            />
                        </label>
                    ))}
                </div>

                <div className={styles.row}>
                    <label
                        className={`${styles.field} ${
                            fieldErrors.phone ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>
                            {fieldErrors.phone || 'شماره تماس'}
                        </span>
                        <input
                            className={styles.input}
                            value={form.phone}
                            onChange={set('phone')}
                            placeholder="09121234567"
                            dir="ltr"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>نقش (اختیاری)</span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={form.role_id}
                                onChange={set('role_id')}
                            >
                                <option value="">بدون نقش</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                </div>

                <label
                    className={`${styles.field} ${
                        fieldErrors.password ? styles.fieldError : ''
                    }`}
                >
                    <span className={styles.label}>
                        {fieldErrors.password || 'رمز عبور اولیه'}
                        <span className={styles.req}>*</span>
                    </span>
                    <input
                        className={styles.input}
                        type="password"
                        value={form.password}
                        onChange={set('password')}
                        autoComplete="new-password"
                        dir="ltr"
                    />
                </label>

                <div className={styles.checkBox}>
                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={set('is_active')}
                        />
                        <span>حساب فعال باشد</span>
                    </label>

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={form.is_verified}
                            onChange={set('is_verified')}
                        />
                        <span>شناسه‌ها تأییدشده علامت بخورند</span>
                    </label>
                </div>

                <p className={styles.hint}>
                    رمز عبور را به کاربر بدهید و از او بخواهید در اولین ورود
                    عوضش کند. این رمز جایی در پنل نمایش داده نمی‌شود.
                </p>

                <div className={styles.actions}>
                    <button type="submit" className={styles.submit} disabled={busy}>
                        {busy ? 'در حال ساخت…' : 'ساخت کاربر'}
                    </button>

                    <button
                        type="button"
                        className={styles.cancel}
                        onClick={onClose}
                        disabled={busy}
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </form>
    )
}
