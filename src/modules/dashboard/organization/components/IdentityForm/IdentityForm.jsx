import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import Input from '../../../../../components/ui/Input/Input'
import Button from '../../../../../components/ui/Button/Button'
import { authService, parseValidationErrors } from '../../../../../services/authService'
import { HTTP, MSG, toEnglishDigits } from '../../../../../constants/auth'
import { jalaliToDateOnly } from '../../../../../utils/datetime'
import styles from './IdentityForm.module.css'

const isValidNationalId = (v) => /^\d{10}$/.test(toEnglishDigits(v).trim())

const EMPTY = {
    first_name: '',
    last_name: '',
    national_id: '',
    birth_date: '',
    company_name: '',
    company_id: '',
    position: '',
    company_address: '',
}

/* نگاشت نام فیلد بک‌اند به کلید همین فرم — برای نشاندن خطای ۴۲۲
   روی فیلد درست. نام‌ها یکی هستند جز birth_date که ممکن است
   بک‌اند درباره‌ی قالبش ایراد بگیرد. */
const FIELD_KEYS = Object.keys(EMPTY)

/**
 * تکمیل هویت — `POST /auth/contact/verify`.
 *
 * این تنها راهی است که کاربر می‌تواند اطلاعات پروفایلش را بنویسد؛
 * اندپوینت ویرایش پروفایل در اسپک وجود ندارد. به همین دلیل فرم
 * همه‌ی فیلدهای `VerifyIdentityInput` را می‌گیرد، نه فقط سه‌تای اجباری.
 *
 * onVerified بعد از موفقیت صدا زده می‌شود تا صفحه پروفایل را
 * دوباره از سرور بخواند.
 */
export default function IdentityForm({ onVerified }) {
    const [form, setForm] = useState(EMPTY)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const setField = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }))
        setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
    }

    const validate = () => {
        const next = {}

        if (!form.first_name.trim()) next.first_name = 'نام را وارد کنید'
        if (!form.last_name.trim()) next.last_name = 'نام خانوادگی را وارد کنید'
        if (!isValidNationalId(form.national_id)) {
            next.national_id = 'کد ملی باید ۱۰ رقم باشد'
        }

        /* تاریخ تولد اختیاری است، ولی اگر پر شده باشد و قابل تبدیل
           نباشد باید همین‌جا بگوییم — نه اینکه بی‌صدا حذفش کنیم. */
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
            /* فیلدهای خالی اصلاً فرستاده نمی‌شوند تا مقدار قبلیِ
               ذخیره‌شده در پروفایل را با null پاک نکنند. */
            const payload = {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                national_id: toEnglishDigits(form.national_id).trim(),
            }

            /* بک‌اند قالب date می‌خواهد (YYYY-MM-DD). از jalaliToDateOnly
               استفاده می‌شود نه slice روی ISO — دلیلش در خود آن تابع. */
            const birthDate = jalaliToDateOnly(form.birth_date)
            if (birthDate) payload.birth_date = birthDate
            if (form.company_name.trim()) payload.company_name = form.company_name.trim()
            if (form.company_id.trim()) payload.company_id = form.company_id.trim()
            if (form.position.trim()) payload.position = form.position.trim()
            if (form.company_address.trim()) {
                payload.company_address = form.company_address.trim()
            }

            const result = await authService.verifyIdentity(payload)

            /* پاسخ ۲۰۲ یک لایه ApiResponse اضافه دارد — همان رفتاری
               که در صفحه‌ی ثبت‌نام هم دیده شده. */
            const data = result?.data ?? result

            if (data?.verified === false) {
                /* بک‌اند خودش می‌گوید چرا تأیید نشد (مثلاً شماره تأیید
                   نشده یا کد ملی با نام نمی‌خواند). */
                setErrors({ _form: data?.message || 'تأیید هویت انجام نشد' })
                return
            }

            setForm(EMPTY)
            onVerified?.(data?.message)
        } catch (err) {
            if (err.status === HTTP.VALIDATION_ERROR) {
                const fields = parseValidationErrors(err.details)
                const mapped = {}
                FIELD_KEYS.forEach((key) => {
                    if (fields[key]) mapped[key] = fields[key]
                })

                setErrors(
                    Object.keys(mapped).length > 0
                        ? mapped
                        : { _form: err.message || MSG.GENERIC }
                )
            } else if (err.status === HTTP.TOO_MANY_REQUESTS) {
                setErrors({ _form: MSG.RATE_LIMIT })
            } else {
                setErrors({ _form: err.message || MSG.GENERIC })
            }
        } finally {
            setLoading(false)
        }
    }

    const canSubmit =
        form.first_name.trim() && form.last_name.trim() && form.national_id.trim()

    return (
        <section className={styles.card}>
            <header className={styles.header}>
                <ShieldCheck size={22} className={styles.icon} />
                <div>
                    <h2 className={styles.title}>تکمیل و تأیید هویت</h2>
                    <p className={styles.hint}>
                        برای استفاده از همه‌ی خدمات پرتال، اطلاعات هویتی خود را
                        تکمیل کنید. نام، نام خانوادگی و کد ملی الزامی است.
                    </p>
                </div>
            </header>

            {errors._form && (
                <p className={styles.formError} role="alert">
                    {errors._form}
                </p>
            )}

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.grid}>
                    <Input
                        label="نام"
                        value={form.first_name}
                        onChange={setField('first_name')}
                        error={errors.first_name}
                        autoComplete="given-name"
                    />
                    <Input
                        label="نام خانوادگی"
                        value={form.last_name}
                        onChange={setField('last_name')}
                        error={errors.last_name}
                        autoComplete="family-name"
                    />
                </div>

                <div className={styles.grid}>
                    <Input
                        label="کد ملی"
                        value={form.national_id}
                        onChange={setField('national_id')}
                        error={errors.national_id}
                        inputMode="numeric"
                        maxLength={10}
                    />
                    <Input
                        label="تاریخ تولد (اختیاری)"
                        value={form.birth_date}
                        onChange={setField('birth_date')}
                        error={errors.birth_date}
                        placeholder="۱۳۷۰/۰۵/۲۰"
                        inputMode="numeric"
                    />
                </div>

                <div className={styles.grid}>
                    <Input
                        label="نام شرکت (اختیاری)"
                        value={form.company_name}
                        onChange={setField('company_name')}
                        error={errors.company_name}
                        autoComplete="organization"
                    />
                    <Input
                        label="شناسه ملی شرکت (اختیاری)"
                        value={form.company_id}
                        onChange={setField('company_id')}
                        error={errors.company_id}
                        inputMode="numeric"
                    />
                </div>

                <Input
                    label="سمت (اختیاری)"
                    value={form.position}
                    onChange={setField('position')}
                    error={errors.position}
                    autoComplete="organization-title"
                />

                <Input
                    label="آدرس شرکت (اختیاری)"
                    value={form.company_address}
                    onChange={setField('company_address')}
                    error={errors.company_address}
                />

                <div className={styles.actions}>
                    <Button type="submit" loading={loading} disabled={!canSubmit}>
                        ثبت و تأیید هویت
                    </Button>
                </div>
            </form>
        </section>
    )
}
