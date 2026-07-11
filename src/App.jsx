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
                {/* مسیرهای عمومی */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* مسیرهای نیازمند ورود */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<HomePage />} />
                    {/* مسیرهای بعدی پنل اینجا اضافه می‌شوند */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;