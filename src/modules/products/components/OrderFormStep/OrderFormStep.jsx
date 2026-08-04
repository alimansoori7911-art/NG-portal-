import { useState } from 'react'
import styles from './OrderFormStep.module.css'

/**
 * مرحله‌ی ۲ — فرم ثبت اطلاعات سفارش.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت      x=167 y=237، ۱۰۲۴×۷۴۴، radius 20، #0D1726 با ۳۰٪ شفافیت
 *   بج پلن    x=191.5 y=261.5، ۷۶×۳۲، radius 16، #132239 + border #668FCC
 *   ضربدر     ۲۴×۲۴ با مرکز (1155, 273)، رنگ #7AB0FF
 *   عنوان     y 290→330 → ۴۰px، #7AB0FF، وسط‌چین
 *   اینپوت    ۴۲۵×۶۵، radius 6.5، border 1px #203A60، فاصله‌ی ستون ۳۱
 *             سه ردیف در y = 372.5 / 468.5 / 564.5 (گام ۹۶)
 *   آدرس      x=237.5 y=660.5، ۸۸۳×۱۹۳
 *   دکمه‌ها    y≈884 — ثبت سفارش ۴۲۴×۴۸ پرشده #4073BF
 *                     انتخاب مجدد ۴۲۶×۵۰ با border 2px #4073BF
 */

/* فیلدهای لازم برای فعال شدن دکمه.
   TODO: اعتبارسنجی واقعی (فرمت ایمیل، شماره، …) را بک‌اند انجام می‌دهد.
         اینجا فقط خالی نبودن چک می‌شود تا دکمه قابل استفاده باشد. */
const REQUIRED_FIELDS = [
    'username',
    'organization',
    'phone',
    'email',
    'organizationId',
    'mkId',
]

const EMPTY_FORM = {
    username: '',
    organization: '',
    phone: '',
    email: '',
    organizationId: '',
    mkId: '',
    address: '',
}

export default function OrderFormStep({
                                          planName,
                                          initialValues,
                                          onDirtyChange,
                                          onBack,
                                          onClose,
                                          onSubmit,
                                      }) {
    /* TODO: بعضی فیلدها باید از حساب کاربری پیش‌پر شوند.
             تا مشخص شدن اسپک /auth/me، همه خالی می‌مانند. */
    const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues })

    const change = (key) => (e) => {
        const value = e.target.value
        setForm((prev) => {
            const next = { ...prev, [key]: value }
            /* والد باید بداند چیزی وارد شده تا موقع بستن تأیید بگیرد */
            onDirtyChange?.(Object.values(next).some((v) => v.trim() !== ''))
            return next
        })
    }

    const isValid = REQUIRED_FIELDS.every((key) => form[key].trim() !== '')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!isValid) return
        onSubmit?.(form)
    }

    return (
        <div className={styles.stage}>
            <form className={styles.card} onSubmit={handleSubmit} noValidate>
                {planName && (
                    <span className={styles.planBadge}>
                        پلن <span dir="ltr">{planName}</span>
                    </span>
                )}

                <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="بستن صفحه"
                >
                    <CloseIcon />
                </button>

                <h2 className={styles.title}>ثبت اطلاعات سفارش</h2>

                <div className={styles.grid}>
                    <input
                        className={styles.input}
                        placeholder="نام کاربری"
                        value={form.username}
                        onChange={change('username')}
                        autoComplete="username"
                    />
                    <input
                        className={styles.input}
                        placeholder="نام سازمان"
                        value={form.organization}
                        onChange={change('organization')}
                        autoComplete="organization"
                    />

                    <input
                        className={styles.input}
                        placeholder="شماره تماس"
                        value={form.phone}
                        onChange={change('phone')}
                        inputMode="tel"
                        autoComplete="tel"
                    />
                    <input
                        className={styles.input}
                        placeholder="ایمیل"
                        value={form.email}
                        onChange={change('email')}
                        inputMode="email"
                        autoComplete="email"
                    />

                    <input
                        className={styles.input}
                        placeholder="شناسه سازمان"
                        value={form.organizationId}
                        onChange={change('organizationId')}
                    />
                    {/* TODO: فرمت «شناسه mk» از کارفرما پرسیده شود */}
                    <input
                        className={styles.input}
                        placeholder="شناسه mk"
                        value={form.mkId}
                        onChange={change('mkId')}
                    />
                </div>

                <textarea
                    className={styles.textarea}
                    placeholder="آدرس"
                    value={form.address}
                    onChange={change('address')}
                />

                <div className={styles.actions}>
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={!isValid}
                    >
                        ثبت سفارش
                    </button>
                    <button
                        type="button"
                        className={styles.backBtn}
                        onClick={onBack}
                    >
                        انتخاب مجدد پلن
                    </button>
                </div>
            </form>
        </div>
    )
}

/* ضربدر ۲۴×۲۴ مطابق فیگما */
function CloseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="12" fill="currentColor" />
            <path
                d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5"
                stroke="#0D1726"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
        </svg>
    )
}