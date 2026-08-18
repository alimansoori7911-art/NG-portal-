import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./router/ProtectedRoute";
import GuestRoute from "./router/GuestRoute";
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
import TicketChatPage from "./modules/helpdesk/pages/TicketChatPage";
/* داشبورد */
import DashboardLayout from "./modules/dashboard/components/DashboardLayout/DashboardLayout";
import ServicesPage from "./modules/dashboard/organization/pages/ServicesPage";
import DashboardTicketsPage from "./modules/dashboard/organization/pages/TicketsPage";
import SessionsPage from "./modules/dashboard/organization/pages/SessionsPage";
import NotificationsPage from "./modules/dashboard/organization/pages/NotificationsPage";
import InvoicesPage from "./modules/dashboard/organization/pages/InvoicesPage";
import LogsPage from "./modules/dashboard/organization/pages/LogsPage";
/* پنل ادمین */
import AdminRoute from "./router/AdminRoute";
import AdminLayout from "./modules/admin/components/AdminLayout/AdminLayout";
import AdminUsersPage from "./modules/admin/pages/UsersPage";
import AdminSupportPage from "./modules/admin/pages/SupportPage";
import AdminCatalogPage from "./modules/admin/pages/CatalogPage";
import AdminSalesPage from "./modules/admin/pages/SalesPage";
import AdminFinancePage from "./modules/admin/pages/FinancePage";
import AdminSettingsPage from "./modules/admin/pages/SettingsPage";

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

                {/* محصولات — معرفی و صفحه‌ی خرید برای همه باز است */}
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/buy" element={<ProductsBuyPage />} />

                {/* Placeholder — بعداً با فیگمای مخصوص خودشان کامل می‌شوند */}
                {/* تماس با ما عمداً عمومی است: بک‌اند تأیید کرده که
                    /landing/contact برای کاربر مهمان و با rate limit
                    به‌ازای هر IP طراحی شده است. */}
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />

                {/* ═══ فقط کاربر واردنشده ═══ */}
                <Route element={<GuestRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                {/* ═══ نیازمند ورود ═══ */}
                <Route element={<ProtectedRoute />}>
                    {/* ثبت و پیگیری سفارش */}
                    <Route path="/products/buy/orders" element={<OrderListPage />} />
                    <Route path="/products/buy/new" element={<NewOrderPage />} />

                    {/* تیکتینگ Help Desk */}
                    <Route path="/helpdesk" element={<HelpdeskPage />} />
                    <Route path="/helpdesk/new" element={<NewTicketPage />} />
                    <Route path="/helpdesk/tickets" element={<HelpdeskTicketsPage />} />
                    <Route path="/helpdesk/tickets/:id/chat" element={<TicketChatPage />} />
                </Route>

                {/* ═══ داشبورد ═══ */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<Navigate to="services" replace />} />
                        <Route path="services" element={<ServicesPage />} />
                        <Route path="tickets" element={<DashboardTicketsPage />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                        <Route path="invoices" element={<InvoicesPage />} />
                        <Route path="logs" element={<LogsPage />} />
                        <Route path="sessions" element={<SessionsPage />} />
                    </Route>
                </Route>

                {/* ═══ پنل ادمین ═══ */}
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="users" replace />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="support" element={<AdminSupportPage />} />
                        <Route path="catalog" element={<AdminCatalogPage />} />
                        <Route path="sales" element={<AdminSalesPage />} />
                        <Route path="finance" element={<AdminFinancePage />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                    </Route>
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;