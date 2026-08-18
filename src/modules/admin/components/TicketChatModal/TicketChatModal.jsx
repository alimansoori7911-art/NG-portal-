import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SendHorizontal, X } from 'lucide-react'
import styles from './TicketChatModal.module.css'

/**
 * مودال پاسخگویی به تیکت — مطابق فیگما.
 *
 * حباب‌های پیام: کاربر سمت راست با حاشیه‌ی خاکستری، پشتیبان سمت چپ
 * با حاشیه و متن آبی. هر حباب برچسب فرستنده بالای خودش دارد.
 *
 * onSend باید Promise<boolean> برگرداند؛ پیش‌نویس فقط در صورت
 * موفقیت پاک می‌شود تا متن کارشناس با خطای شبکه از بین نرود.
 */
export default function TicketChatModal({
    open,
    messages = [],
    loading = false,
    error = null,
    sending = false,
    sendError = null,
    onClose,
    onSend,
}) {
    const [draft, setDraft] = useState('')
    const listRef = useRef(null)

    // بستن با Escape و قفل کردن اسکرول صفحه‌ی پشت
    useEffect(() => {
        if (!open) return

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [open, onClose])

    // با هر پیام تازه، انتهای گفتگو دیده شود
    useEffect(() => {
        if (open && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [open, messages.length])

    if (!open) return null

    const submit = async (e) => {
        e.preventDefault()
        const text = draft.trim()
        if (!text || sending) return

        const ok = await onSend?.(text)
        if (ok !== false) setDraft('')
    }

    return createPortal(
        <div className={styles.overlay} onMouseDown={onClose}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-label="پاسخگویی به تیکت"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className={styles.close}
                    onClick={onClose}
                    aria-label="بستن"
                >
                    <X size={16} strokeWidth={3} />
                </button>

                {/* گفتگو از پایین پر می‌شود؛ فضای خالی بالای آن می‌ماند */}
                <div className={styles.messages} ref={listRef}>
                    {loading && (
                        <div className={`${styles.row} ${styles.rowSupport}`}>
                            <p className={styles.bubble}>در حال دریافت گفتگو…</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className={`${styles.row} ${styles.rowSupport}`} role="alert">
                            <p className={styles.bubble}>{error}</p>
                        </div>
                    )}

                    {!loading && !error && messages.length === 0 && (
                        <div className={`${styles.row} ${styles.rowSupport}`}>
                            <p className={styles.bubble}>پیامی در این تیکت ثبت نشده است</p>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`${styles.row} ${
                                m.from === 'support' ? styles.rowSupport : styles.rowUser
                            }`}
                        >
                            <span className={styles.sender}>
                                {m.from === 'support' ? 'پشتیبان:' : 'کاربر:'}
                                {m.internal && ' (یادداشت داخلی)'}
                            </span>
                            <p className={styles.bubble}>{m.text}</p>
                        </div>
                    ))}

                    {sendError && (
                        <div className={`${styles.row} ${styles.rowSupport}`} role="alert">
                            <p className={styles.bubble}>{sendError}</p>
                        </div>
                    )}
                </div>

                <form className={styles.composer} onSubmit={submit}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="متن خود را اینجا تایپ کنید"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        aria-label="متن پاسخ"
                    />
                    <button
                        type="submit"
                        className={styles.send}
                        disabled={!draft.trim() || sending}
                        aria-label="ارسال"
                    >
                        <SendHorizontal size={22} />
                    </button>
                </form>
            </div>
        </div>,
        document.body
    )
}
