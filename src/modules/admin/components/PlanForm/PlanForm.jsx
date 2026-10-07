import { useState } from 'react'
import { X } from 'lucide-react'
import styles from './PlanForm.module.css'

/**
 * فرم ساخت/ویرایش پلن — مطابق product2.svg.
 *
 * اعداد از SVG:
 *   فیلدها ۴۲۳×۶۳، radius 5.5، border #8CABD9
 *   دو ستون: x=134.5 (چپ) و x=630.5 (راست) → در RTL راست اول است
 *   گام عمودی ۱۲۸ (y = 392.5 / 520.5 / 648.5 / 776.5)
 *   عنوان «ایجاد پلن» ۱۰۸×۳۸ در y=292
 *   دکمه «ذخیره پلن» ۱۱۳×۴۰ در y=922
 *   ضربدر بستن بالای فرم سمت چپ
 *
 * فیلدهای قابلیت (asset management، Auditing، Hardening) از روی
 * featureList ساخته می‌شوند نه ثابت — چون قابلیت‌ها از بک‌اند می‌آیند.
 */
export default function PlanForm({
    initialValues,
    featureList = [],
    termList = [],
    saving = false,
    error = '',
    onSubmit,
    onClose,
}) {
    const [form, setForm] = useState(() => ({
        name: '',
        description: '',
        external_plan_code: '',
        term_code: '',
        ...initialValues,
        features: { ...(initialValues?.features ?? {}) },
    }))
    const [fieldErrors, setFieldErrors] = useState({})

    const change = (key) => (e) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }))

    const changeFeature = (key) => (e) => {
        const { value } = e.target
        setForm((prev) => ({
            ...prev,
            features: { ...prev.features, [key]: value },
        }))
    }

    /* ⚠️ `CreatePlan` سه فیلد را **الزامی** می‌داند: `code`، `name` و
       `external_plan_code`. `code` را خودمان می‌سازیم، ولی دو تای دیگر
       از فرم می‌آیند و تا امروز هیچ بررسی‌ای نداشتند — فرم با شناسه‌ی
       خالی ارسال می‌شد و سرور ۴۲۲ می‌داد بی‌آنکه معلوم باشد کدام فیلد
       مقصر است. */
    const submit = (e) => {
        e.preventDefault()

        const errs = {}
        if (!String(form.name ?? '').trim()) errs.name = 'نام پلن الزامی است'
        if (!String(form.external_plan_code ?? '').trim()) {
            errs.external_plan_code = 'شناسه الزامی است'
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        setFieldErrors({})
        onSubmit?.(form)
    }

    const isEditing = Boolean(initialValues?.id)

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

            <h2 className={styles.title}>{isEditing ? 'ویرایش پلن' : 'ایجاد پلن'}</h2>

            {/* دو ستونه — در RTL ستون راست اول می‌آید */}
            <div className={styles.grid}>
                <Field
                    label="کاربران هدف"
                    value={form.description}
                    onChange={change('description')}
                />
                <Field
                    label={fieldErrors.name || 'نوع پلن'}
                    value={form.name}
                    onChange={change('name')}
                    invalid={Boolean(fieldErrors.name)}
                    ltr
                />
                <Field
                    label={fieldErrors.external_plan_code || 'شناسه'}
                    value={form.external_plan_code}
                    onChange={change('external_plan_code')}
                    invalid={Boolean(fieldErrors.external_plan_code)}
                    ltr
                />
                {/* مدت اعتبار روی خود پلن نیست؛ در BillingTerm تعریف شده
                    و از طریق PlanPrice.term_code به پلن وصل می‌شود.
                    پس به‌جای متن آزاد، از لیست انتخاب می‌شود. */}
                <SelectField
                    label="مدت اعتبار"
                    value={form.term_code}
                    onChange={change('term_code')}
                    options={termList}
                />

                {featureList.map((f) => (
                    <Field
                        key={f.code}
                        label={f.name}
                        value={form.features[f.code] ?? ''}
                        onChange={changeFeature(f.code)}
                        ltr
                    />
                ))}
            </div>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <button type="submit" className={styles.submit} disabled={saving}>
                {saving ? 'در حال ذخیره…' : 'ذخیره پلن'}
            </button>
        </form>
    )
}

/* برچسب داخل کادر بالا سمت راست، مقدار زیرش — مطابق فیگما */
function Field({ label, value, onChange, ltr = false, invalid = false }) {
    return (
        <label className={`${styles.field} ${invalid ? styles.fieldInvalid : ''}`}>
            <span className={styles.fieldLabel}>{label}</span>
            <input
                className={styles.fieldInput}
                value={value}
                onChange={onChange}
                dir={ltr ? 'ltr' : undefined}
            />
        </label>
    )
}

/* همان ظاهر Field ولی با انتخاب از لیست.
   options: [{ code, name }] — code مقدار ارسالی و name متن نمایشی */
function SelectField({ label, value, onChange, options }) {
    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <select className={styles.fieldSelect} value={value} onChange={onChange}>
                <option value="">انتخاب کنید</option>
                {options.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                        {opt.name}
                    </option>
                ))}
            </select>
        </label>
    )
}
