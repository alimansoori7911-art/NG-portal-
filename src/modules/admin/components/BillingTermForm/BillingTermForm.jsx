import { useState } from 'react'
import { X } from 'lucide-react'
/* عمداً از استایل PlanForm استفاده می‌شود: این فرم در همان صفحه و
   کنار آن می‌نشیند و باید دقیقاً همان ظاهر فیگما را داشته باشد.
   ساختن یک ماژول تکراری فقط باعث واگرایی این دو با هم می‌شد. */
import styles from '../PlanForm/PlanForm.module.css'
import own from './BillingTermForm.module.css'

/**
 * فرم ساخت/ویرایش «مدت اعتبار» (BillingTerm).
 *
 * چرا لازم است: مدت اعتبار روی خود پلن نیست؛ موجودیت مستقلی است که
 * از راه `PlanPrice.term_code` به پلن وصل می‌شود. فرم پلن گزینه‌هایش
 * را از همین لیست می‌گیرد، ولی تا پیش از این هیچ رابطی برای ساختن
 * مدت جدید وجود نداشت — یعنی اگر لیست خالی بود، پلن قیمت نمی‌گرفت.
 *
 * ⚠️ `code` فقط موقع ساخت گرفته می‌شود. این کد کلیدِ اتصال قیمت‌ها
 * است و تغییرش قیمت‌های موجود را یتیم می‌کند، پس در ویرایش قفل است.
 */
export default function BillingTermForm({
    initialValues,
    saving = false,
    error = '',
    onSubmit,
    onClose,
}) {
    const isEditing = Boolean(initialValues?.id)

    const [form, setForm] = useState(() => ({
        code: '',
        name: '',
        is_trial: false,
        is_active: true,
        ...initialValues,
        /* بعد از اسپرد می‌آید تا حتماً برنده شود: رشته نگه داشته
           می‌شود نه عدد، چون فیلد خالی یعنی «بی‌نهایت» و باید از صفر
           قابل تشخیص باشد. */
        duration_days:
            initialValues?.duration_days == null
                ? ''
                : String(initialValues.duration_days),
    }))

    const change = (key) => (e) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }))

    const toggle = (key) => (e) =>
        setForm((prev) => ({ ...prev, [key]: e.target.checked }))

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

            <h2 className={styles.title}>
                {isEditing ? 'ویرایش مدت اعتبار' : 'ایجاد مدت اعتبار'}
            </h2>

            <div className={styles.grid}>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>نام نمایشی</span>
                    <input
                        className={styles.fieldInput}
                        value={form.name}
                        onChange={change('name')}
                        placeholder="یک‌ساله"
                        required
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        کد {isEditing && '(قابل تغییر نیست)'}
                    </span>
                    <input
                        className={styles.fieldInput}
                        value={form.code}
                        onChange={change('code')}
                        dir="ltr"
                        placeholder="yearly"
                        /* در ویرایش قفل است — رجوع به توضیح بالای فایل */
                        disabled={isEditing}
                        required={!isEditing}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        مدت به روز — خالی یعنی بی‌نهایت
                    </span>
                    <input
                        className={styles.fieldInput}
                        value={form.duration_days}
                        onChange={change('duration_days')}
                        dir="ltr"
                        inputMode="numeric"
                        placeholder="۳۶۵"
                    />
                </label>

                <div className={own.checks}>
                    <label className={own.check}>
                        <input
                            type="checkbox"
                            checked={Boolean(form.is_trial)}
                            onChange={toggle('is_trial')}
                        />
                        <span>دوره‌ی آزمایشی است</span>
                    </label>

                    <label className={own.check}>
                        <input
                            type="checkbox"
                            checked={form.is_active !== false}
                            onChange={toggle('is_active')}
                        />
                        <span>فعال</span>
                    </label>
                </div>
            </div>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <button type="submit" className={styles.submit} disabled={saving}>
                {saving ? 'در حال ذخیره…' : 'ذخیره مدت اعتبار'}
            </button>
        </form>
    )
}
