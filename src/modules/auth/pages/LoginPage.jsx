import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout/AuthLayout";
import Input from "../../../components/ui/Input/Input";
import Button from "../../../components/ui/Button/Button";
import Alert from "../../../components/ui/Alert/Alert";
import { authService, parseValidationErrors } from "../../../services/authService";
import { useAuthStore } from "../../../store/authStore";
import { HTTP, MSG, toEnglishDigits } from "../../../constants/auth";
import styles from "./LoginPage.module.css";

/* تشخیص نوع شناسه برای ارسال فیلد درست به بک‌اند.
   LoginInput فقط password را اجباری می‌داند و یکی از
   email / phone_number / username را می‌پذیرد. */
function buildCredentials(identifier, password) {
    const value = identifier.trim();
    if (value.includes("@")) return { email: value, password };

    // ارقام فارسی/عربی به لاتین تبدیل می‌شوند تا رجکس شماره درست کار کند
    const normalized = toEnglishDigits(value);
    if (/^(\+98|0)?9\d{9}$/.test(normalized)) {
        return { phone_number: normalized, password };
    }

    return { username: value, password };
}

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const setAuth = useAuthStore((s) => s.setAuth);

    // مسیری که کاربر قبل از ریدایرکت به /login قصد رفتن به آن را داشت
    const from = location.state?.from?.pathname ?? "/";

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [apiError, setApiError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const errors = {};
        if (!identifier.trim()) errors.identifier = "نام کاربری را وارد کنید";
        if (!password) errors.password = "رمز عبور را وارد کنید";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        if (!validate()) return;

        setLoading(true);
        try {
            const data = await authService.login(buildCredentials(identifier, password));
            setAuth(data);
            navigate(from, { replace: true });
        } catch (err) {
            if (err.status === HTTP.UNAUTHORIZED) {
                setApiError(
                    "خطا در ورود به حساب کاربری، نام کاربری و رمز عبور خود را بررسی کنید"
                );
            } else if (err.status === HTTP.TOO_MANY_REQUESTS) {
                setApiError(MSG.RATE_LIMIT);
            } else if (err.status === HTTP.VALIDATION_ERROR) {
                // بک‌اند نام فیلد را برمی‌گرداند (email / phone_number / username)
                const raw = parseValidationErrors(err.details);
                const firstMessage = Object.values(raw)[0];
                if (raw.password) setFieldErrors({ password: raw.password });
                else if (firstMessage) setFieldErrors({ identifier: firstMessage });
                setApiError(firstMessage || MSG.GENERIC);
            } else {
                setApiError(err.message || MSG.GENERIC);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Alert onClose={() => setApiError("")}>{apiError}</Alert>

            <h1 className={styles.title}>خوش آمدید!</h1>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <Input
                    type="text"
                    placeholder="نام کاربری"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    error={fieldErrors.identifier || (apiError ? " " : "")}
                    autoComplete="username"
                    autoFocus
                />
                <Input
                    type="password"
                    placeholder="رمز عبور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={fieldErrors.password || (apiError ? " " : "")}
                    autoComplete="current-password"
                />

                <Link to="/forgot-password" className={styles.link}>
                    آیا رمز عبور خود را فراموش کرده اید؟
                </Link>

                <Button type="submit" loading={loading}>
                    ورود
                </Button>
            </form>

            <p className={styles.footerText}>
                حساب کاربری نداری ؟{" "}
                <Link to="/register" className={styles.link}>
                    همین حالا ثبت نام کن
                </Link>
            </p>
        </AuthLayout>
    );
}