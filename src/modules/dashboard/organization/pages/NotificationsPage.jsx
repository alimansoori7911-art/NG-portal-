import { useState } from 'react'
import NotificationCard from '../components/NotificationCard/NotificationCard'
import { useNotifications } from '../hooks/useNotifications'
import styles from './NotificationsPage.module.css'

/**
 * اعلان‌های کاربر — شبکه‌ی سه‌ستونه از کارت‌های باز/بسته‌شونده.
 *
 * در فیگما چند کارت هم‌زمان باز هستند، پس چند اعلان می‌توانند
 * همزمان باز باشند (نه فقط یکی).
 *
 * باز کردن یک کارت آن را «خوانده» می‌کند.
 */
export default function NotificationsPage() {
    const {
        items,
        page,
        pageCount,
        unreadCount,
        loading,
        error,
        setPage,
        markRead,
        markAllRead,
    } = useNotifications()

    /* مجموعه‌ی شناسه‌های باز */
    const [expanded, setExpanded] = useState(() => new Set())

    const toggle = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
                /* باز کردن یعنی کاربر آن را دید */
                markRead(id)
            }
            return next
        })
    }

    /* خروج زودهنگام بعد از همه‌ی هوک‌هاست تا ترتیب هوک‌ها بین
       رندرها ثابت بماند (Rules of Hooks). */
    if (loading) return <p className={styles.state}>در حال دریافت اعلان‌ها…</p>
    if (error) return <p className={styles.state} role="alert">{error}</p>

    return (
        <div className={styles.page}>
            {items.length > 0 && unreadCount > 0 && (
                <div className={styles.toolbar}>
                    <span className={styles.unread}>
                        {unreadCount} اعلان نخوانده
                    </span>
                    <button
                        type="button"
                        className={styles.markAllBtn}
                        onClick={markAllRead}
                    >
                        علامت‌گذاری همه به‌عنوان خوانده‌شده
                    </button>
                </div>
            )}

            {items.length === 0 ? (
                <p className={styles.state}>اعلانی برای نمایش وجود ندارد</p>
            ) : (
                <div className={styles.grid}>
                    {items.map((item) => (
                        <NotificationCard
                            key={item.id}
                            item={item}
                            expanded={expanded.has(item.id)}
                            onToggle={toggle}
                        />
                    ))}
                </div>
            )}

            {pageCount > 1 && (
                <nav className={styles.pagination} aria-label="صفحه‌بندی">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            type="button"
                            className={`${styles.pageBtn} ${
                                n === page ? styles.pageBtnActive : ''
                            }`}
                            onClick={() => setPage(n)}
                            aria-current={n === page ? 'page' : undefined}
                        >
                            {n}
                        </button>
                    ))}
                </nav>
            )}
        </div>
    )
}
