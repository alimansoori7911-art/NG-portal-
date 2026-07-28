import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./router/ProtectedRoute";
import HomePage from "./modules/home/pages/HomePage";
import LoginPage from "./modules/auth/pages/LoginPage";
import RegisterPage from "./modules/auth/pages/RegisterPage";
import ForgotPasswordPage from "./modules/auth/pages/ForgotPasswordPage";
import AboutPage from "./modules/about/pages/AboutPage";
import ContactPage from "./modules/contact/pages/ContactPage";
import TermsPage from "./modules/terms/pages/TermsPage";
import ProductsPage from "./modules/products/pages/ProductsPage";
import ProductsBuyPage from "./modules/products/pages/ProductsBuyPage";
import HelpdeskPage from "./modules/helpdesk/pages/HelpdeskPage";
import NewTicketPage from "./modules/helpdesk/pages/NewTicketPage";
import TicketsPage from "./modules/helpdesk/pages/TicketsPage";
import DevSidebarTest from "./DevSidebarTest"; // ⚠️ موقت — حذف شود
function App() {
    const initialize = useAuthStore((s) => s.initialize);

    useEffect(() => {
      //  initialize();
    }, [initialize]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />

                {/* شرکت / درباره ما */}
                <Route path="/company" element={<AboutPage />} />

                {/* محصولات */}
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/buy" element={<ProductsBuyPage />} />

                {/* تیکتینگ Help Desk */}
                <Route path="/helpdesk" element={<HelpdeskPage />} />
                <Route path="/helpdesk/new" element={<NewTicketPage />} />
                <Route path="/helpdesk/tickets" element={<TicketsPage />} />
                {/* Placeholder — بعداً با فیگمای مخصوص خودشان کامل می‌شوند */}
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                {/* ⚠️ موقت — حذف شود */}
                <Route path="/dev-sidebar" element={<DevSidebarTest />} />

                <Route element={<ProtectedRoute />}>
                    {/* مثال: <Route path="/dashboard" element={<Dashboard />} /> */}
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;