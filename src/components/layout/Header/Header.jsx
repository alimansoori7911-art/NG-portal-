import { useState } from 'react'
import { Home, ShoppingCart, LayoutGrid, LifeBuoy, User, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, getDisplayName, hasRole } from '../../../store/authStore'
import styles from './Header.module.css'

/* دکمه‌های میان‌بر سمت راست — authOnly یعنی فقط برای کاربر لاگین‌شده.

   تیکتینگ برای همه دیده می‌شود ولی مسیرش محافظت‌شده است: مهمان به
   ورود می‌رود و ProtectedRoute مسیر را نگه می‌دارد تا بعد از ورود
   به همین‌جا برگردد. */
const QUICK_LINKS = [
    { label: 'صفحه اصلی', icon: Home, path: '/' },
    { label: 'خرید', icon: ShoppingCart, path: '/products/buy' },
    { label: 'تیکتینگ', icon: LifeBuoy, path: '/helpdesk' },
    { label: 'داشبورد', icon: LayoutGrid, path: '/dashboard', authOnly: true },
]

const NAV_ITEMS = [
    /* بدون زیرمنو: تیکتینگ از اینجا برداشته شد (پشتیبانی زیرمجموعه‌ی
       محصول نیست) و تنها آیتم باقی‌مانده خودِ همین صفحه بود. */
    { label: 'محصولات', path: '/products' },
    /* `soon: true` یعنی صفحه‌اش هنوز ساخته نشده: کلیک کاری نمی‌کند و
       برچسب «به‌زودی» ظاهر می‌شود — بردن کاربر به صفحه‌ی سفید بدتر از
       نرفتن است.

       الان هیچ آیتمی آن را ندارد (خدمات و منابع ساخته شدند) ولی
       سازوکارش می‌ماند برای صفحه‌های بعدی. */
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

    /* ادمین با همان حساب وارد می‌شود ولی داشبوردش پنل مدیریت است.
       بقیه‌ی سایت برایش باز می‌ماند؛ فقط مقصد این دکمه فرق می‌کند. */
    const dashboardPath = hasRole(user, 'admin') ? '/admin' : '/dashboard'

    const quickLinks = QUICK_LINKS
        .filter(link => !link.authOnly || isLoggedIn)
        .map(link => (link.path === '/dashboard' ? { ...link, path: dashboardPath } : link))

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
                            className={`${styles.navItem} ${item.soon ? styles.navItemSoon : ''}`}
                            onClick={() => !item.soon && goTo(item.path)}
                            aria-disabled={item.soon || undefined}
                        >
                            {item.label}
                        </button>

                        {/* برچسب «به‌زودی» — با هاور روی همان دکمه */}
                        {item.soon && (
                            <span className={styles.soonBadge} aria-hidden="true">
                                به‌زودی…
                            </span>
                        )}

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
                    /* باکس کاربر — مثل دکمه‌ی داشبورد به داشبورد شخصی می‌رود.
                       در RTL اولین فرزند سمت راست می‌نشیند: همبرگر ← آواتار ← نام */
                    <button
                        type="button"
                        className={styles.userBox}
                        onClick={() => goTo(dashboardPath)}
                        title="داشبورد"
                    >
                        <Menu size={16} className={styles.userMenuIcon} aria-hidden="true" />
                        <span className={styles.userAvatar}>
                            <User size={14} />
                        </span>
                        <span className={styles.userName}>{getDisplayName(user)}</span>
                    </button>
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
                        {/* روی موبایل هاور وجود ندارد، پس برچسب همیشه
                            کنار متن دیده می‌شود. */}
                        <button
                            className={`${styles.mobileNavItem} ${item.soon ? styles.mobileNavItemSoon : ''}`}
                            onClick={() => {
                                if (item.soon) return
                                item.items ? toggleMobileDropdown(item.label) : goTo(item.path)
                            }}
                            aria-disabled={item.soon || undefined}
                        >
                            {item.label}
                            {item.soon && (
                                <span className={styles.soonInline}>به‌زودی…</span>
                            )}
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