import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, hasRole } from '../store/authStore'
import styles from './ProtectedRoute.module.css'

/**
 * محافظ پنل ادمین.
 *
 * ادمین با همان صفحه‌ی ورود عادی وارد می‌شود (رمز مخصوص خودش) و بک‌اند
 * نقش 'admin' را در آرایه‌ی roles برمی‌گرداند. پس اینجا فقط نقش چک می‌شود.
 *
 * کاربر واردنشده → /login  (همان رفتار ProtectedRoute)
 * کاربر بدون نقش ادمین → داشبورد خودش، نه صفحه‌ی خطا؛ چون این آدرس
 * برایش وجود خارجی ندارد و نمایش «دسترسی ندارید» فقط لو می‌دهد که
 * چنین مسیری هست.
 */
export default function AdminRoute() {
    const status = useAuthStore((s) => s.status)
    const user = useAuthStore((s) => s.user)
    const location = useLocation()

    if (status === 'checking') {
        return (
            <div className={styles.loader} role="status" aria-label="در حال بارگذاری">
                <span className={styles.spinner} />
            </div>
        )
    }

    if (status === 'guest') {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    if (!hasRole(user, 'admin')) {
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}
