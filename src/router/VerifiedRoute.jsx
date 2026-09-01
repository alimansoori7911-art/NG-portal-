import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import styles from './ProtectedRoute.module.css'

/* صفحه‌ای که کاربرِ تأییدنشده اجازه دارد ببیند — فرم تکمیل هویت
   همان‌جاست، پس اگر خودش را هم اینجا ببندیم حلقه‌ی بی‌پایان می‌شود. */
const ALLOWED = '/dashboard/account'

/**
 * گیت تأیید هویت.
 *
 * طبق فلو، کاربری که هویتش تأیید نشده نباید وارد چرخه‌ی سفارش شود:
 * سفارش به نام و کد ملی نیاز دارد و پیش‌فاکتور بدون آن‌ها بی‌معناست.
 *
 * تا حالا هیچ گیتی وجود نداشت — کاربر تازه‌ثبت‌نام‌کرده مستقیم وارد
 * داشبورد می‌شد و هیچ‌جا به او گفته نمی‌شد که باید هویتش را تکمیل کند.
 *
 * ⚠️ `is_verified` فقط در `GET /auth/me` (شمای `Profile`) هست، نه در
 * پاسخ لاگین. تا رسیدنش `user` هنوز پروفایل کامل نیست، پس اگر فیلد
 * اصلاً وجود نداشت **مانع نمی‌شویم** — بستن راه کاربرِ تأییدشده بدتر
 * از باز گذاشتن موقتِ آن است.
 */
export default function VerifiedRoute() {
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

    /* پروفایل هنوز نرسیده یا این شکل از پاسخ فیلد را ندارد */
    const known = user && 'is_verified' in user

    if (known && !user.is_verified && location.pathname !== ALLOWED) {
        return <Navigate to={ALLOWED} replace state={{ needsVerification: true }} />
    }

    return <Outlet />
}
