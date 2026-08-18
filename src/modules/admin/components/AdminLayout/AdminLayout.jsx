import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../AdminSidebar/AdminSidebar'
import AdminTopbar from '../AdminTopbar/AdminTopbar'
import { ADMIN_MENU_ITEMS } from '../../constants/menuItems'
import styles from './AdminLayout.module.css'

/**
 * چیدمان پنل ادمین (فریم ۱۴۴۰×۱۰۲۴).
 *
 * سایدبار ۲۵۱px سمت راست، بقیه ستون محتوا با نوار بالا.
 * عنوان نوار بالا از روی مسیر فعلی خوانده می‌شود تا هر صفحه لازم نباشد
 * خودش آن را پاس بدهد.
 */
export default function AdminLayout() {
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()

    /* با تغییر مسیر منوی کشویی بسته می‌شود — تنظیم state حین رندر
       تا رندر آبشاری ایجاد نشود (مثل DashboardLayout). */
    const [lastPath, setLastPath] = useState(location.pathname)
    if (lastPath !== location.pathname) {
        setLastPath(location.pathname)
        setMenuOpen(false)
    }

    const current = ADMIN_MENU_ITEMS.find((item) =>
        location.pathname.startsWith(item.path)
    )

    return (
        <div className={styles.shell}>
            {/* در RTL اولین فرزند سمت راست می‌نشیند */}
            <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

            <div className={styles.content}>
                <AdminTopbar
                    title={current?.label ?? 'پنل مدیریت'}
                    onMenuClick={() => setMenuOpen(true)}
                />

                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
