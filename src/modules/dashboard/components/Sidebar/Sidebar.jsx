import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Circle, House, LogOut, ShoppingCart, User } from 'lucide-react'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useAuthStore, getDisplayName } from '../../../../store/authStore'
import styles from './Sidebar.module.css'

/**
 * سایدبار مشترک داشبورد.
 * items: [{ id, label, path }] — هر داشبورد آرایه‌ی خودش را می‌دهد.
 * وضعیت فعال از روی URL خوانده می‌شود (NavLink) نه state داخلی،
 * تا رفرش صفحه و دکمه‌ی back مرورگر درست کار کنند.
 *
 * open / onClose فقط زیر ۱۰۲۴px کاربرد دارند (حالت کشویی).
 */
export default function Sidebar({ items = [], open = false, onClose }) {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

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

    const go = (path) => {
        onClose?.()
        navigate(path)
    }

    return (
        <>
            {/* پس‌زمینه‌ی تیره — فقط در حالت کشویی */}
            <div
                className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>

                {/* ── کارت پروفایل ── */}
                <div className={styles.profile}>
                    <div className={styles.profileCard}>
                        <span className={styles.avatar}>
                            <User size={24} />
                        </span>
                        <span className={styles.profileName}>{getDisplayName(user)}</span>
                    </div>
                </div>

                {/* ── منوی اصلی ── */}
                <nav className={styles.menu}>
                    {items.map(({ id, label, path }) => (
                        <NavLink
                            key={id}
                            to={path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `${styles.item} ${isActive ? styles.itemActive : ''}`
                            }
                        >
                            <Circle size={16} strokeWidth={1.5} className={styles.itemIcon} />
                            <span className={styles.itemLabel}>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* ── دکمه‌های پایین — در RTL اولین فرزند سمت راست است ── */}
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => go('/products/buy')}
                    >
                        <ShoppingCart size={24} className={styles.actionIcon} />
                        <span className={styles.actionLabel}>خرید</span>
                    </button>

                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setLogoutOpen(true)}
                    >
                        <LogOut size={24} className={styles.actionIcon} />
                        <span className={styles.actionLabel}>خروج</span>
                    </button>

                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => go('/')}
                    >
                        <House size={24} className={styles.actionIcon} />
                        <span className={styles.actionLabel}>صفحه اصلی</span>
                    </button>
                </div>

            </aside>

            <ConfirmDialog
                open={logoutOpen}
                title="خروج از حساب کاربری"
                message="آیا قصد خارج شدن از حساب کاربری پرتال را دارید؟"
                confirmLabel="خروج از حساب کاربری"
                cancelLabel="بستن صفحه"
                loading={loggingOut}
                onConfirm={handleLogout}
                onClose={() => setLogoutOpen(false)}
            />
        </>
    )
}