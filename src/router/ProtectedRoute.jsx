import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import styles from "./ProtectedRoute.module.css";

/**
 * استفاده در App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<DashboardLayout />} />
 *   </Route>
 *
 * موقع checking: اسپینر نمایش داده می‌شود (نه صفحه‌ی سفید)
 * موقع guest: ریدایرکت به /login همراه با مسیر فعلی در state
 */
export default function ProtectedRoute() {
    const status = useAuthStore((s) => s.status);
    const location = useLocation();

    if (status === "checking") {
        return (
            <div className={styles.loader} role="status" aria-label="در حال بارگذاری">
                <span className={styles.spinner} />
            </div>
        );
    }

    if (status === "guest") {
        // مسیر فعلی ذخیره می‌شود تا پس از ورود، کاربر به همان‌جا برگردد
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}