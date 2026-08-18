import { NavLink } from 'react-router-dom'
import logo from '../../../../assets/images/logo/logowhite.png'
import { ADMIN_MENU_ITEMS } from '../../constants/menuItems'
import styles from './AdminSidebar.module.css'

/**
 * سایدبار پنل ادمین — سمت راست، عرض ۲۵۱px (از SVG).
 *
 * با سایدبار داشبورد سازمانی فرق دارد: لوگو بالای آن است، آیتم‌ها آیکون
 * دارند، و آیتم فعال به‌جای پس‌زمینه‌ی پر، یک نوار آبی در لبه‌ی راست دارد.
 *
 * open / onClose فقط زیر ۱۰۲۴px کاربرد دارند (حالت کشویی).
 */
export default function AdminSidebar({ open = false, onClose }) {
    return (
        <>
            <div
                className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
                {/* لوگو — در SVG در x=1276 y=40، اندازه ۷۶×۴۰ */}
                <div className={styles.logoWrapper}>
                    <img src={logo} alt="NGcorion" className={styles.logo} />
                </div>

                <nav className={styles.menu}>
                    {ADMIN_MENU_ITEMS.map(({ id, label, path, icon: Icon }) => (
                        <NavLink
                            key={id}
                            to={path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `${styles.item} ${isActive ? styles.itemActive : ''}`
                            }
                        >
                            <span className={styles.itemLabel}>{label}</span>
                            <Icon size={20} className={styles.itemIcon} aria-hidden="true" />
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    )
}
