import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, CircleHelp, LogOut, Menu, User } from 'lucide-react'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useAuthStore, getDisplayName } from '../../../../store/authStore'
import { useNotifications } from '../../../dashboard/organization/hooks/useNotifications'
import styles from './AdminTopbar.module.css'

/**
 * نوار بالای پنل ادمین.
 *
 * چیدمان (در RTL، از راست به چپ):
 *   عنوان صفحه → منوی کاربر → اعلان → راهنما
 *
 * دکمه‌ی همبرگر فقط زیر ۱۰۲۴px دیده می‌شود.
 *
 * ⚠️ کادر جستجو برداشته شد: نه `value`/`onChange` داشت نه
 * اندپوینت جستجوی سراسری وجود دارد (حتی
 * `GET /admin/auth/users` پارامتر `q` ندارد — بند ۱.۳ در
 * BACKEND_REQUESTS.md). کادری که تایپ می‌پذیرد ولی کاری
 * نمی‌کند بدتر از نبودنش است.
 */
export default function AdminTopbar({ title, onMenuClick, onHelpClick }) {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

    const { items, unreadCount, markRead, markAllRead } = useNotifications()
    const [open, setOpen] = useState(false)
    const bellRef = useRef(null)

    /* منوی کاربر — دکمه‌اش قبلاً فلش داشت ولی باز نمی‌شد */
    const [userOpen, setUserOpen] = useState(false)
    const userRef = useRef(null)
    const [logoutOpen, setLogoutOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await logout()
            navigate('/', { replace: true })
        } finally {
            setLoggingOut(false)
            setLogoutOpen(false)
        }
    }

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

    useEffect(() => {
        if (!userOpen) return

        const onClickOutside = (e) => {
            if (userRef.current && !userRef.current.contains(e.target)) {
                setUserOpen(false)
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [userOpen])

    /* Esc هر دو منو را می‌بندد */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return
            setUserOpen(false)
            setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

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

            {/* در RTL اولین فرزند سمت راست می‌نشیند */}
            <div className={styles.actions}>
                <div className={styles.userWrap} ref={userRef}>
                    <button
                        type="button"
                        className={styles.user}
                        onClick={() => setUserOpen((v) => !v)}
                        aria-expanded={userOpen}
                        aria-haspopup="menu"
                    >
                        <span className={styles.avatar}>
                            <User size={18} />
                        </span>
                        <span className={styles.userName}>{getDisplayName(user)}</span>
                        <ChevronDown
                            size={16}
                            className={`${styles.userChevron} ${
                                userOpen ? styles.userChevronOpen : ''
                            }`}
                        />
                    </button>

                    {userOpen && (
                        <div className={styles.userMenu} role="menu">
                            <button
                                type="button"
                                className={styles.userMenuItem}
                                role="menuitem"
                                onClick={() => {
                                    setUserOpen(false)
                                    navigate('/dashboard/account')
                                }}
                            >
                                <User size={16} />
                                حساب کاربری من
                            </button>

                            <button
                                type="button"
                                className={`${styles.userMenuItem} ${styles.userMenuDanger}`}
                                role="menuitem"
                                onClick={() => {
                                    setUserOpen(false)
                                    setLogoutOpen(true)
                                }}
                            >
                                <LogOut size={16} />
                                خروج از حساب
                            </button>
                        </div>
                    )}
                </div>

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

                <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="راهنمای این صفحه"
                    title="راهنمای این صفحه"
                    onClick={onHelpClick}
                >
                    <CircleHelp size={18} />
                </button>
            </div>

            <ConfirmDialog
                open={logoutOpen}
                title="خروج از حساب کاربری"
                message="آیا قصد خارج شدن از حساب کاربری پرتال را دارید؟"
                confirmLabel="خروج از حساب کاربری"
                cancelLabel="بستن"
                loading={loggingOut}
                onConfirm={handleLogout}
                onClose={() => setLogoutOpen(false)}
            />
        </header>
    )
}
