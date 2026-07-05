import { useState } from 'react'
import { Home, User, Menu } from 'lucide-react'
import styles from './Header.module.css'

const NAV_ITEMS = [
    { label: 'محصولات', path: '/products' },
    { label: 'خدمات', path: '/services' },
    { label: 'منابع', path: '/resources' },
    { label: 'شرکت', path: '/company' },
    { label: 'قوانین', path: '/terms' },
]

function Header() {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <header className={styles.header}>

            {/* سمت چپ — منو + خانه */}
            <nav className={styles.nav}>
                <button className={styles.homeBtn} aria-label="خانه">
                    <Home size={18} />
                </button>
                {NAV_ITEMS.map(item => (
                    <button key={item.path} className={styles.navItem}>
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* سمت راست — حساب کاربری + همبرگر موبایل */}
            <div className={styles.right}>
                <button className={styles.accountBtn}>
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

            {/* منوی موبایل */}
            <div className={`${styles.mobileNav} ${mobileOpen ? styles.open : ''}`}>
                {NAV_ITEMS.map(item => (
                    <button key={item.path} className={styles.mobileNavItem}>
                        {item.label}
                    </button>
                ))}
            </div>

        </header>
    )
}

export default Header