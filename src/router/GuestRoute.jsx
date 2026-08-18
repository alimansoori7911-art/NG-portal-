import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import styles from "./ProtectedRoute.module.css";

/**
 * قرینه‌ی ProtectedRoute: صفحه‌هایی که فقط برای کاربر واردنشده معنی دارند
 * (ورود، ثبت‌نام، بازیابی رمز).
 *
 * چرا لازم است؟
 * بدون این، کاربرِ لاگین می‌تواند دوباره وارد /login شود و با ثبت فرم،
 * نشست فعلی‌اش rotate شود. ضمناً دکمه‌ی «حساب کاربری» در هدر برای او
 * بی‌معنی می‌شد.
 *
 * موقع checking همان اسپینر ProtectedRoute نمایش داده می‌شود تا فرم ورود
 * برای لحظه‌ای به کاربرِ لاگین نشان داده نشود و بعد پرتاب شود.
 */
export default function GuestRoute() {
    const status = useAuthStore((s) => s.status);
    const location = useLocation();

    if (status === "checking") {
        return (
            <div className={styles.loader} role="status" aria-label="در حال بارگذاری">
                <span className={styles.spinner} />
            </div>
        );
    }

    if (status === "authenticated") {
        // اگر کاربر از یک صفحه‌ی محافظت‌شده به اینجا هدایت شده بود،
        // به همان‌جا برمی‌گردد؛ وگرنه به داشبورد.
        const from = location.state?.from?.pathname;
        return <Navigate to={from || "/dashboard"} replace />;
    }

    return <Outlet />;
}
