import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, CircleHelp, Menu, Search, User } from 'lucide-react'
import { useAuthStore, getDisplayName } from '../../../../store/authStore'
import { useNotifications } from '../../../dashboard/organization/hooks/useNotifications'
import styles from './AdminTopbar.module.css'

/**
 * نوار بالای پنل ادمین.
 *
 * چیدمان از SVG (در RTL، از راست به چپ):
 *   عنوان صفحه → جستجو (x=516، ۳۴۶×۴۰) → آواتار و نام → اعلان → راهنما
 *
 * دکمه‌ی همبرگر فقط زیر ۱۰۲۴px دیده می‌شود.
 *
 * TODO: جستجو هنوز اندپوینت ندارد — فعلاً فقط ظاهر است.
 * TODO: راهنما صفحه‌ای ندارد.
 */
export default function AdminTopbar({ title, onMenuClick }) {
    const user = useAuthStore((s) => s.user)

    const { items, unreadCount, markRead, markAllRead } = useNotifications()
    const [open, setOpen] = useState(false)
    const bellRef = useRef(null)

    /* بستن پنل با کلیک بیرون */
    useEffect(() => {
        if (!open) return

        const onClickOutside = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [open])

    return (
        <header className={styles.topbar}>
            <button
                type="button"
                className={styles.menuToggle}
                onClick={onMenuClick}
                aria-label="باز کردن منو"
            >
                <Menu size={22} />
            </button>

            <h1 className={styles.title}>{title}</h1>

            <div className={styles.searchBox}>
                <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Search type of keywords"
                    aria-label="جستجو"
                />
                <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            </div>

            {/* در RTL اولین فرزند سمت راست می‌نشیند */}
            <div className={styles.actions}>
                <button type="button" className={styles.user}>
                    <span className={styles.avatar}>
                        <User size={18} />
                    </span>
                    <span className={styles.userName}>{getDisplayName(user)}</span>
                    <ChevronDown size={16} className={styles.userChevron} />
                </button>

                <div className={styles.bellWrap} ref={bellRef}>
                    <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setOpen((v) => !v)}
                        aria-label={
                            unreadCount > 0
                                ? `اعلان‌ها — ${unreadCount} نخوانده`
                                : 'اعلان‌ها'
                        }
                        aria-expanded={open}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className={styles.badge}>
                                {unreadCount > 99 ? '۹۹+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {open && (
                        <div className={styles.bellPanel}>
                            <div className={styles.bellHead}>
                                <span>اعلان‌ها</span>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        className={styles.bellMarkAll}
                                        onClick={markAllRead}
                                    >
                                        خواندن همه
                                    </button>
                                )}
                            </div>

                            {items.length === 0 ? (
                                <p className={styles.bellEmpty}>اعلانی وجود ندارد</p>
                            ) : (
                                <ul className={styles.bellList}>
                                    {items.slice(0, 6).map((n) => (
                                        <li key={n.id}>
                                            <button
                                                type="button"
                                                className={`${styles.bellItem} ${
                                                    n.read ? '' : styles.bellItemUnread
                                                }`}
                                                onClick={() => markRead(n.id)}
                                            >
                                                <span className={styles.bellItemTitle}>
                                                    {n.title}
                                                </span>
                                                <span className={styles.bellItemBody}>
                                                    {n.body}
                                                </span>
                                                <span className={styles.bellItemDate}>
                                                    {n.summary}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <button type="button" className={styles.iconBtn} aria-label="راهنما">
                    <CircleHelp size={18} />
                </button>
            </div>
        </header>
    )
}
