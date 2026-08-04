import { useEffect } from 'react'
import styles from './TicketDetailModal.module.css'

/**
 * مودال جزئیات تیکت — روی صفحه‌ی لیست باز می‌شود.
 *
 * اعداد از SVG فیگما (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت      x=239.5 y=95.5، ۹۶۱×۸۳۳، radius 20.5
 *             #0D1726 با ۳۰٪ شفافیت + border 1px #203A60
 *   نوار بالا y 95→257 (ارتفاع ۱۶۲)، #0D1726 + border 2px #132239
 *             ستون‌ها در x = 1086 / 728 / 362
 *             برچسب ۲۴px | مقدار ۱۸px
 *   توضیحات   x=278.5 y=319.5، ۸۸۳×۱۹۳، radius 6.5، border 1px #8CABD9
 *   جداکننده  line y=575.5 از x=240 تا 1200، رنگ #132239
 *   عنوان     y 612→640 → ۲۸px با گرادیان #4792FF → #7AB0FF → #4792FF
 *   بج وضعیت  x=272.5 y=609.5، ۸۵×۳۲، radius 16، #132239 + border #668FCC
 *   دکمه‌ها    y≈847 — چت ۴۲۴×۴۸ پرشده #4073BF
 *                     بستن ۴۲۶×۵۰ با border 2px #4073BF
 */
export default function TicketDetailModal({ ticket, open, onClose, onOpenChat }) {
    /* بستن با کلید Escape */
    useEffect(() => {
        if (!open) return

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    if (!open || !ticket) return null

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.backdrop} onClick={onClose} />

            <div className={styles.card}>
                {/* ─── نوار بالا ─── */}
                <div className={styles.summary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>تاریخ</span>
                        <span className={styles.summaryValue}>{ticket.date}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>دپارتمان</span>
                        <span className={styles.summaryValue}>{ticket.department}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>وضعیت</span>
                        <span className={styles.summaryValue}>{ticket.status}</span>
                    </div>
                </div>

                {/* ─── توضیحات ثبت‌شده ─── */}
                <div className={styles.descBox}>
                    <span className={styles.descLabel}>توضیحات</span>
                    <p className={styles.descText}>{ticket.description}</p>
                </div>

                <div className={styles.divider} />

                {/* ─── نتیجه ─── */}
                <div className={styles.resultHead}>
                    <h2 className={styles.resultTitle}>نتیجه تیکت!</h2>
                    <span className={styles.statusBadge}>{ticket.status}</span>
                </div>

                <p className={styles.resultText}>{ticket.result}</p>

                {/* ─── دکمه‌ها ─── */}
                <div className={styles.actions}>
                    <button type="button" className={styles.chatBtn} onClick={onOpenChat}>
                        رفتن به صفحه چت
                    </button>
                    <button type="button" className={styles.closeTicketBtn} onClick={onClose}>
                        بستن تیکت
                    </button>
                </div>
            </div>
        </div>
    )
}