import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout/AuthLayout";
import Input from "../../../components/ui/Input/Input";
import Button from "../../../components/ui/Button/Button";
import Alert from "../../../components/ui/Alert/Alert";
import { authService } from "../../../services/authService";
import { useAuthStore } from "../../../store/authStore";
import styles from "./LoginPage.module.css";

/* تشخیص نوع شناسه برای ارسال فیلد درست به بک‌اند */
function buildCredentials(identifier, password) {
    const value = identifier.trim();
    if (value.includes("@")) return { email: value, password };
    if (/^(\+98|0)?9\d{9}$/.test(value)) return { phone_number: value, password };
    return { username: value, password };
}

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

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
            navigate("/", { replace: true });
        } catch (err) {
            if (err.status === 401) {
                setApiError("خطا در ورود به حساب کاربری، نام کاربری و رمز عبور خود را بررسی کنید");
            } else if (err.status === 429) {
                setApiError("تعداد تلاش‌های شما بیش از حد مجاز است. کمی بعد دوباره امتحان کنید");
            } else {
                setApiError(err.message);
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