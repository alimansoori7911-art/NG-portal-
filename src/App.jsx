import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import HelpdeskTicketsPage from "./modules/helpdesk/pages/TicketsPage";
import OrderListPage from "./modules/products/pages/OrderListPage";
import NewOrderPage from "./modules/products/pages/NewOrderPage";
/* داشبورد */
import DashboardLayout from "./modules/dashboard/components/DashboardLayout/DashboardLayout";
import ServicesPage from "./modules/dashboard/organization/pages/ServicesPage";
import DashboardTicketsPage from "./modules/dashboard/organization/pages/TicketsPage";

function App() {
    const initialize = useAuthStore((s) => s.initialize);

    useEffect(() => {
        initialize();
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
                <Route path="/products/buy/orders" element={<OrderListPage />} />
                <Route path="/products/buy/new" element={<NewOrderPage />} />

                {/* تیکتینگ Help Desk */}
                <Route path="/helpdesk" element={<HelpdeskPage />} />
                <Route path="/helpdesk/new" element={<NewTicketPage />} />
                <Route path="/helpdesk/tickets" element={<HelpdeskTicketsPage />} />

                {/* Placeholder — بعداً با فیگمای مخصوص خودشان کامل می‌شوند */}
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* ═══ داشبورد ═══ */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<Navigate to="services" replace />} />
                        <Route path="services" element={<ServicesPage />} />
                        <Route path="tickets" element={<DashboardTicketsPage />} />
                        {/* TODO: support / notifications / billing / logs / sessions
                            هنوز فیگما و اندپوینت ندارند — فعلاً روت ندارند */}
                    </Route>
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;