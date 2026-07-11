import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * استفاده در App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 * موقع checking (لود اولیه): صفحه‌ی سفید نشان نمی‌دهد
 * موقع guest: ریدایرکت به /login با ذخیره‌ی مسیر فعلی
 */
export default function ProtectedRoute() {
    const status = useAuthStore((s) => s.status);

    if (status === "checking") {
        return null;
    }

    if (status === "guest") {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}