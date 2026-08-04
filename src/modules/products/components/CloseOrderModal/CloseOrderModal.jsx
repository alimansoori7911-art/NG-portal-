import { useEffect } from 'react'
import styles from './CloseOrderModal.module.css'

/**
 * مودال تأیید بستن صفحه‌ی درخواست.
 *
 * فقط وقتی باز می‌شود که کاربر در فرم چیزی وارد کرده باشد؛ در بقیه‌ی
 * مراحل چیزی برای از دست دادن نیست و صفحه مستقیم بسته می‌شود.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت   x=399 y=211، ۶۴۲×۶۰۲، radius 11، #000814 + border 2px #132239
 *   ضربدر  ۲۴×۲۴ با مرکز (1004, 248)، رنگ #7AB0FF
 *   عنوان  y 312→347 → ۳۵px، #4792FF
 *   متن    y 378→459 سه خط، #ADCFFF
 *   دکمه‌ها ۴۲۶×۵۰، radius 11، border 2px #4073BF، y = 508 / 588 / 668 (گام ۸۰)
 */
export default function CloseOrderModal({ open, onSave, onDiscard, onCancel }) {
    /* بستن با کلید Escape */
    useEffect(() => {
        if (!open) return

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onCancel?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onCancel])

    if (!open) return null

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.backdrop} onClick={onCancel} />

            <div className={styles.card}>
                <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onCancel}
                    aria-label="بستن"
                >
                    <CloseIcon />
                </button>

                <h2 className={styles.title}>بستن صفحه درخواست</h2>

                <p className={styles.message}>
                    در صورت بسته شدن صفحه، اطلاعات شما پاک خواهد شد،آیا مالید
                    اطلاعات درخواست شما ذخیره شود ؟
                </p>

                <div className={styles.actions}>
                    {/* TODO: ذخیره‌ی واقعی پس از آماده شدن بک‌اند.
                        فعلاً مثل «بستن صفحه» عمل می‌کند. */}
                    <button type="button" className={styles.actionBtn} onClick={onSave}>
                        اطلاعات ذخیره شود
                    </button>
                    <button type="button" className={styles.actionBtn} onClick={onDiscard}>
                        بستن صفحه
                    </button>
                    <button type="button" className={styles.actionBtn} onClick={onCancel}>
                        برگشت به صفحه قبل
                    </button>
                </div>
            </div>
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