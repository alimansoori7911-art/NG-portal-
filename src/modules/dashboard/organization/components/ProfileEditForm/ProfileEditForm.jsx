import { useState } from 'react'
import { UserPen } from 'lucide-react'
import Input from '../../../../../components/ui/Input/Input'
import Button from '../../../../../components/ui/Button/Button'
import { authService, parseValidationErrors } from '../../../../../services/authService'
import { HTTP, MSG } from '../../../../../constants/auth'
import { formatJalaliDateTime, jalaliToDateOnly } from '../../../../../utils/datetime'
import styles from './ProfileEditForm.module.css'

/* فیلدهای `UserProfilePatchSchema` — همه اختیاری‌اند */
const FIELDS = [
    { key: 'first_name', label: 'نام', max: 50, autoComplete: 'given-name' },
    { key: 'last_name', label: 'نام خانوادگی', max: 50, autoComplete: 'family-name' },
    { key: 'company_name', label: 'نام شرکت', max: 50, autoComplete: 'organization' },
    { key: 'position', label: 'سمت', max: 50, autoComplete: 'organization-title' },
]

/**
 * ویرایش پروفایل — `PATCH /auth/me` (اسپک ۱۵).
 *
 * تا قبل از این، کاربر هیچ راهی برای اصلاح اطلاعاتش نداشت و فقط
 * یک‌بار موقع تأیید هویت می‌توانست پرشان کند.
 *
 * ⚠️ ایمیل، شماره و کد ملی اینجا نیستند — `UserProfilePatchSchema`
 * آن‌ها را نمی‌پذیرد. برای تغییرشان باید از تأیید هویت یا ادمین
 * اقدام شود.
 */
export default function ProfileEditForm({ user, onSaved, onCancel }) {
    /* مقدار اولیه از پروفایل فعلی — کاربر باید ببیند چه چیزی را
       دارد عوض می‌کند، نه اینکه از خالی شروع کند. */
    const [form, setForm] = useState(() => ({
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        company_name: user?.company_name ?? '',
        position: user?.position ?? '',
        company_address: user?.company_address ?? '',
        birth_date: formatJalaliDateTime(user?.birth_date).date ?? '',
    }))

    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const setField = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }))
        setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
    }

    const validate = () => {
        const next = {}
        if (form.birth_date.trim() && !jalaliToDateOnly(form.birth_date)) {
            next.birth_date = 'تاریخ را مثل ۱۳۷۰/۰۵/۲۰ وارد کنید'
        }
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        try {
            /* فیلد خالی به‌صورت null فرستاده می‌شود نه حذف: کاربر باید
               بتواند مقداری را که قبلاً گذاشته پاک کند. اسپک همه را
               nullable گرفته، پس null معتبر است. */
            const payload = {
                first_name: form.first_name.trim() || null,
                last_name: form.last_name.trim() || null,
                company_name: form.company_name.trim() || null,
                position: form.position.trim() || null,
                company_address: form.company_address.trim() || null,
                birth_date: jalaliToDateOnly(form.birth_date) || null,
            }

            await authService.updateProfile(payload)
            onSaved?.()
        } catch (err) {
            if (err.status === HTTP.VALIDATION_ERROR) {
                const fields = parseValidationErrors(err.details)
                const mapped = {}
                Object.keys(form).forEach((k) => {
                    if (fields[k]) mapped[k] = fields[k]
                })
                setErrors(
                    Object.keys(mapped).length > 0
                        ? mapped
                        : { _form: err.message || MSG.GENERIC }
                )
            } else {
                setErrors({ _form: err?.message || MSG.GENERIC })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className={styles.card}>
            <header className={styles.header}>
                <UserPen size={22} className={styles.icon} />
                <div>
                    <h2 className={styles.title}>ویرایش اطلاعات</h2>
                    <p className={styles.hint}>
                        برای تغییر ایمیل، شماره تماس یا کد ملی با پشتیبانی
                        تماس بگیرید.
                    </p>
                </div>
            </header>

            {errors._form && (
                <p className={styles.error} role="alert">
                    {errors._form}
                </p>
            )}

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.grid}>
                    {FIELDS.map(({ key, label, max, autoComplete }) => (
                        <Input
                            key={key}
                            label={label}
                            value={form[key]}
                            onChange={setField(key)}
                            error={errors[key]}
                            maxLength={max}
                            autoComplete={autoComplete}
                            disabled={loading}
                        />
                    ))}
                </div>

                <Input
                    label="تاریخ تولد"
                    value={form.birth_date}
                    onChange={setField('birth_date')}
                    error={errors.birth_date}
                    placeholder="۱۳۷۰/۰۵/۲۰"
                    inputMode="numeric"
                    disabled={loading}
                />

                <Input
                    label="آدرس شرکت"
                    value={form.company_address}
                    onChange={setField('company_address')}
                    error={errors.company_address}
                    maxLength={512}
                    disabled={loading}
                />

                <div className={styles.actions}>
                    <Button type="submit" loading={loading}>
                        ذخیره تغییرات
                    </Button>

                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        انصراف
                    </button>
                </div>
            </form>
        </section>
    )
}
