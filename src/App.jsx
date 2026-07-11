import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./router/ProtectedRoute";
import HomePage from "./modules/home/pages/HomePage";
import LoginPage from "./modules/auth/pages/LoginPage";
import RegisterPage from "./modules/auth/pages/RegisterPage";
import ForgotPasswordPage from "./modules/auth/pages/ForgotPasswordPage";

function App() {
    const initialize = useAuthStore((s) => s.initialize);

    // یک‌بار موقع لود اپ: با کوکی رفرش، کاربر لاگین رو شناسایی می‌کند
    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <BrowserRouter>
            <Routes>
                {/* صفحه‌ی اصلی سایت — برای همه (لاگین یا مهمان) باز است */}
                <Route path="/" element={<HomePage />} />

                {/* مسیرهای احراز هویت */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* مسیرهای نیازمند ورود (پنل کاربری) — از اینجا به بعد اضافه می‌شوند */}
                <Route element={<ProtectedRoute />}>
                    {/* مثال: <Route path="/dashboard" element={<Dashboard />} /> */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;