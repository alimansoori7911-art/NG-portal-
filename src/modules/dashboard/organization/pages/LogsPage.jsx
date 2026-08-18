import { useState } from 'react'
import { MOCK_LOGS, LOG_FILTERS } from '../data/mockLogs'
import styles from './LogsPage.module.css'

/**
 * مدیریت LOG — فهرست لاگ‌ها با فیلتر سطح.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کادر فیلتر ۸۸۳×۱۰۳، radius 10.5، حاشیه #264573
 *   دکمه‌های فیلتر ۱۶۷×۵۵، radius 10.5 — ترتیب از راست:
 *     Warning #E85D04 | Error #990000 | Info #7AB0FF
 *   ردیف لاگ ۹۸۷×۶۳، radius 9.5، پس‌زمینه #060B13
 *   گام عمودی ۸۸ → فاصله‌ی ۲۵ بین ردیف‌ها
 *
 * فیلترها تجمعی‌اند: هر کدام روشن/خاموش می‌شود و اگر هیچ‌کدام روشن
 * نباشد همه‌ی لاگ‌ها نمایش داده می‌شوند.
 *
 * TODO: اندپوینتی وجود ندارد. رجوع به BACKEND_NEEDS.md
 */
export default function LogsPage() {
    const [active, setActive] = useState(() => new Set())

    const toggle = (id) =>
        setActive((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    const rows =
        active.size === 0
            ? MOCK_LOGS
            : MOCK_LOGS.filter((log) => active.has(log.level))

    return (
        <div className={styles.page}>
            {/* در RTL اولین فرزند سمت راست می‌نشیند — مطابق فیگما */}
            <div className={styles.filterBar}>
                {LOG_FILTERS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={`${styles.filterBtn} ${styles[id]} ${
                            active.has(id) ? styles.filterActive : ''
                        }`}
                        onClick={() => toggle(id)}
                        aria-pressed={active.has(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className={styles.list}>
                {rows.length === 0 ? (
                    <p className={styles.empty}>لاگی برای نمایش وجود ندارد</p>
                ) : (
                    rows.map((log) => (
                        <article
                            key={log.id}
                            className={`${styles.row} ${styles[log.level]}`}
                        >
                            <span className={styles.time} dir="ltr">
                                {log.time}
                            </span>
                            <p className={styles.message}>{log.message}</p>
                        </article>
                    ))
                )}
            </div>
        </div>
    )
}
