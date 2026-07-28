import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Circle, House, LogOut, ShoppingCart, User } from 'lucide-react'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useAuthStore, getDisplayName } from '../../../../store/authStore'
import styles from './Sidebar.module.css'

/**
 * سایدبار مشترک داشبورد.
 * items: [{ id, label }] — هر داشبورد آرایه‌ی خودش را می‌دهد.
 * TODO: با مشخص شدن مسیرها، به‌جای activeId از NavLink استفاده می‌شود.
 */
export default function Sidebar({ items = [], defaultActive }) {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

    const [activeId, setActiveId] = useState(defaultActive ?? items[0]?.id)
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

    return (
        <>
            <aside className={styles.sidebar}>

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
                    {items.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            className={`${styles.item} ${activeId === id ? styles.itemActive : ''}`}
                            onClick={() => setActiveId(id)}
                            aria-current={activeId === id ? 'page' : undefined}
                        >
                            <Circle size={16} strokeWidth={1.5} className={styles.itemIcon} />
                            <span className={styles.itemLabel}>{label}</span>
                        </button>
                    ))}
                </nav>

                {/* ── دکمه‌های پایین — در RTL اولین فرزند سمت راست است ── */}
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => navigate('/products/buy')}
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
                        onClick={() => navigate('/')}
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