import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from '../Sidebar/Sidebar'
import { ORG_MENU_ITEMS } from '../../organization/constants/menuItems'
import styles from './DashboardLayout.module.css'

/**
 * چیدمان صفحات داشبورد (بدون هدر سایت — مطابق فیگما).
 *
 * اعداد از SVG فیگما (فریم ۱۴۴۰×۱۰۲۴):
 *   حاشیه چپ ۴۷ | ستون محتوا ۱۰۲۲ | فاصله ۴۶ | سایدبار ۳۱۴ | حاشیه راست ۱۱
 *   حاشیه‌ی عمودی ۱۱ | کارت جدول از y=63 شروع می‌شود → ۵۲px فاصله از بالای ستون
 *
 * TODO: فعلاً همیشه منوی سازمانی نمایش داده می‌شود.
 *       با مشخص شدن منوی کاربر عادی، بر اساس hasRole(user, 'org_admin') سوییچ شود.
 */
export default function DashboardLayout() {
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()

    /* با تغییر مسیر، منوی کشویی بسته می‌شود.
       تنظیم state حین رندر (نه در useEffect) تا رندر آبشاری ایجاد نشود:
       https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes */
    const [lastPath, setLastPath] = useState(location.pathname)
    if (lastPath !== location.pathname) {
        setLastPath(location.pathname)
        setMenuOpen(false)
    }

    return (
        <div className={styles.shell}>
            {/* در RTL اولین فرزند سمت راست می‌نشیند */}
            <Sidebar
                items={ORG_MENU_ITEMS}
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            />

            <main className={styles.main}>
                <button
                    type="button"
                    className={styles.menuToggle}
                    onClick={() => setMenuOpen(true)}
                    aria-label="باز کردن منو"
                >
                    <Menu size={22} />
                </button>

                <Outlet />
            </main>
        </div>
    )
}