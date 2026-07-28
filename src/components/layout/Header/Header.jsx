import { useState } from 'react'
import { Home, ShoppingCart, LayoutGrid, User, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, getDisplayName } from '../../../store/authStore'
import styles from './Header.module.css'

/* دکمه‌های میان‌بر سمت راست — authOnly یعنی فقط برای کاربر لاگین‌شده */
const QUICK_LINKS = [
    { label: 'صفحه اصلی', icon: Home, path: '/' },
    { label: 'خرید', icon: ShoppingCart, path: '/products/buy' },
    { label: 'داشبورد', icon: LayoutGrid, path: '/dashboard', authOnly: true },
]

const NAV_ITEMS = [
    {
        label: 'محصولات',
        path: '/products',
        items: [
            {
                label: 'محصول',
                description: 'با راهکارهای امنیتی NGcorion و قابلیت‌های هر محصول آشنا شوید',
                path: '/products',
                highlighted: true,
            },
            {
                label: 'تیکتینگ Help Desk',
                description: 'درخواست پشتیبانی ثبت کنید و روند رسیدگی تیکت‌ها را دنبال کنید',
                path: '/helpdesk',
            },
        ],
    },
    { label: 'خدمات', path: '/services' },
    { label: 'منابع', path: '/resources' },
    {
        label: 'شرکت',
        path: '/company',
        items: [
            {
                label: 'درباره ما',
                description: 'با تیم، ماموریت و مسیر رشد NGcorion آشنا شوید',
                path: '/company',
                highlighted: true,
            },
            {
                label: 'تماس با ما',
                description: 'برای مشاوره و پشتیبانی با کارشناسان ما در ارتباط باشید',
                path: '/contact',
            },
            {
                label: 'قوانین و مقررات',
                description: 'شرایط استفاده و حریم خصوصی پرتال را مطالعه کنید',
                path: '/terms',
            },
        ],
    },
]

function Header() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [openMobileDropdown, setOpenMobileDropdown] = useState(null)
    const navigate = useNavigate()

    const user = useAuthStore((s) => s.user)
    const status = useAuthStore((s) => s.status)
    const isLoggedIn = status === 'authenticated'

    const goTo = (path) => {
        setMobileOpen(false)
        setOpenMobileDropdown(null)
        navigate(path)
    }

    const toggleMobileDropdown = (label) => {
        setOpenMobileDropdown(prev => (prev === label ? null : label))
    }

    const quickLinks = QUICK_LINKS.filter(link => !link.authOnly || isLoggedIn)

    return (
        <header className={styles.header}>

            {/* سمت راست — میان‌برها */}
            <div className={styles.quickNav}>
                {quickLinks.map(({ label, icon: Icon, path }) => (
                    <button
                        key={path}
                        className={styles.quickBtn}
                        onClick={() => goTo(path)}
                    >
                        <Icon size={16} className={styles.quickIcon} />
                        <span className={styles.quickLabel}>{label}</span>
                    </button>
                ))}
            </div>

            {/* وسط — منوی اصلی */}
            <nav className={styles.nav}>
                {NAV_ITEMS.map(item => (
                    <div key={item.path} className={styles.navItemWrapper}>
                        <button
                            className={styles.navItem}
                            onClick={() => goTo(item.path)}
                        >
                            {item.label}
                        </button>

                        {/* پنل دراپ‌داون — فقط روی دسکتاپ با هاور نمایش داده می‌شود */}
                        {item.items && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownPanel}>
                                    <div className={styles.dropdownRight}>
                                        {item.items.filter(i => i.highlighted).map(sub => (
                                            <button
                                                key={sub.path}
                                                className={styles.dropdownItem}
                                                onClick={() => goTo(sub.path)}
                                            >
                                                <span className={styles.dropdownTitle}>{sub.label}</span>
                                                <span className={styles.dropdownDesc}>{sub.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.dropdownLeft}>
                                        {item.items.filter(i => !i.highlighted).map(sub => (
                                            <button
                                                key={sub.path}
                                                className={styles.dropdownItem}
                                                onClick={() => goTo(sub.path)}
                                            >
                                                <span className={styles.dropdownTitle}>{sub.label}</span>
                                                <span className={styles.dropdownDesc}>{sub.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* سمت چپ — حساب کاربری + همبرگر موبایل */}
            <div className={styles.right}>
                {isLoggedIn ? (
                    /* باکس کاربر — طبق فیگما فعلاً تعاملی نیست.
                       در RTL اولین فرزند سمت راست می‌نشیند: همبرگر ← آواتار ← نام */
                    <div className={styles.userBox}>
                        <Menu size={16} className={styles.userMenuIcon} aria-hidden="true" />
                        <span className={styles.userAvatar}>
                            <User size={14} />
                        </span>
                        <span className={styles.userName}>{getDisplayName(user)}</span>
                    </div>
                ) : (
                    <button className={styles.accountBtn} onClick={() => navigate('/login')}>
                        <User size={16} />
                        <span>حساب کاربری</span>
                    </button>
                )}

                <button
                    className={styles.menuBtn}
                    onClick={() => setMobileOpen(prev => !prev)}
                    aria-label="منو"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            {/* منوی موبایل — دراپ‌داون‌ها با کلیک باز می‌شوند */}
            <div className={`${styles.mobileNav} ${mobileOpen ? styles.open : ''}`}>
                {NAV_ITEMS.map(item => (
                    <div key={item.path} className={styles.mobileNavGroup}>
                        <button
                            className={styles.mobileNavItem}
                            onClick={() => item.items ? toggleMobileDropdown(item.label) : goTo(item.path)}
                        >
                            {item.label}
                        </button>

                        {item.items && openMobileDropdown === item.label && (
                            <div className={styles.mobileDropdown}>
                                {item.items.map(sub => (
                                    <button
                                        key={sub.path}
                                        className={styles.mobileDropdownItem}
                                        onClick={() => goTo(sub.path)}
                                    >
                                        {sub.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

        </header>
    )
}

export default Header