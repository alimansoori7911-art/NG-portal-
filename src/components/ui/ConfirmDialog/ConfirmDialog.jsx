import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import styles from './ConfirmDialog.module.css'

/**
 * دیالوگ تأیید عمومی — مطابق طرح فیگما.
 *  open: نمایش/عدم نمایش
 *  title / message: متن هدر و بدنه
 *  confirmLabel / cancelLabel: برچسب دکمه‌ها
 *  onConfirm / onClose: رفتار دکمه‌ها
 *  loading: دکمه‌ی تأیید را غیرفعال می‌کند
 */
export default function ConfirmDialog({
                                          open,
                                          title,
                                          message,
                                          confirmLabel = 'تأیید',
                                          cancelLabel = 'بستن صفحه',
                                          onConfirm,
                                          onClose,
                                          loading = false,
                                      }) {
    const confirmRef = useRef(null)

    // بستن با Escape و قفل کردن اسکرول صفحه‌ی پشت
    useEffect(() => {
        if (!open) return

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        confirmRef.current?.focus()

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [open, onClose])

    if (!open) return null

    return createPortal(
        <div className={styles.overlay} onMouseDown={onClose}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button
                        type="button"
                        className={styles.close}
                        onClick={onClose}
                        aria-label="بستن"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>
                </header>

                <div className={styles.body}>
                    <p className={styles.message}>{message}</p>
                </div>

                {/* در RTL اولین فرزند سمت راست قرار می‌گیرد */}
                <footer className={styles.footer}>
                    <button
                        ref={confirmRef}
                        type="button"
                        className={styles.button}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {confirmLabel}
                    </button>
                    <button type="button" className={styles.button} onClick={onClose}>
                        {cancelLabel}
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    )
}