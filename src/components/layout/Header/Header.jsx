import { useState } from 'react'
import { Home, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import styles from './Header.module.css'

const NAV_ITEMS = [
    { label: 'محصولات', path: '/products' },
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

    const goTo = (path) => {
        setMobileOpen(false)
        setOpenMobileDropdown(null)
        navigate(path)
    }

    const toggleMobileDropdown = (label) => {
        setOpenMobileDropdown(prev => (prev === label ? null : label))
    }

    return (
        <header className={styles.header}>

            {/* سمت چپ — منو + خانه */}
            <nav className={styles.nav}>
                <button className={styles.homeBtn} aria-label="خانه" onClick={() => goTo('/')}>
                    <Home size={18} />
                </button>

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

            {/* سمت راست — حساب کاربری + همبرگر موبایل */}
            <div className={styles.right}>
                <button className={styles.accountBtn} onClick={() => navigate('/login')}>
                    <User size={16} />
                    <span>حساب کاربری</span>
                </button>
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