import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CardLayout from "../components/CardLayout/CardLayout";
import OtpInput from "../components/OtpInput/OtpInput";
import Input from "../../../components/ui/Input/Input";
import Button from "../../../components/ui/Button/Button";
import Alert from "../../../components/ui/Alert/Alert";
import { authService, parseValidationErrors } from "../../../services/authService";
import { useAuthStore } from "../../../store/authStore";
import { OTP, HTTP, MSG, toEnglishDigits } from "../../../constants/auth";
import styles from "./RegisterPage.module.css";

const isValidPhone = (v) => /^(\+98|0)?9\d{9}$/.test(toEnglishDigits(v).trim());
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidNationalId = (v) => /^\d{10}$/.test(toEnglishDigits(v).trim());

/* نام فیلدهای بک‌اند با نام فیلدهای این فرم یکی نیست.
   مقدار null یعنی آن فیلد در این فرم نمایش داده نمی‌شود. */
const FIELD_MAP = {
    phone_number: null,
    national_id: "national_code",
    company_id: "organization",
};

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [alertVariant, setAlertVariant] = useState("error");

    const [phone, setPhone] = useState("");

    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [otpKey, setOtpKey] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(OTP.COOLDOWN_SECONDS);

    // زمان تأیید موفق OTP — برای تشخیص انقضای مهلت پیش از ارسال فرم
    const [verifiedAt, setVerifiedAt] = useState(0);

    /* پس از register موفق، حساب ساخته شده و کاربر لاگین است.
       اگر مرحله‌ی تأیید کد ملی خطا بدهد، کاربر در همین فرم می‌ماند و
       دوباره تلاش می‌کند؛ این فلگ جلوی فراخوانی دوباره‌ی register را
       می‌گیرد که در غیر این صورت خطای «حساب تکراری» می‌داد. */
    const registeredRef = useRef(false);

    const [form, setForm] = useState({
        username: "",
        national_code: "",
        first_name: "",
        email: "",
        last_name: "",
        password: "",
        organization: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (step !== 2 || secondsLeft <= 0) return;
        const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [step, secondsLeft]);

    const showError = (message) => {
        setAlertVariant("error");
        setApiError(message);
    };

    const showNotice = (message) => {
        setAlertVariant("success");
        setApiError(message);
    };

    const requestCode = async () => {
        const data = await authService.requestOtp({
            action: "register",
            phone_number: toEnglishDigits(phone).trim(),
        });
        if (data?.otp) console.info("[DEV] کد تأیید:", data.otp);
    };

    // ── مرحله ۱: شماره تلفن ──
    const handleSendCode = async (e) => {
        e.preventDefault();
        setApiError("");
        setLoading(true);
        try {
            await requestCode();
            setSecondsLeft(OTP.COOLDOWN_SECONDS);
            setStep(2);
        } catch (err) {
            if (err.status === HTTP.TOO_MANY_REQUESTS) {
                showError(MSG.RATE_LIMIT);
            } else if (err.status === HTTP.SERVICE_UNAVAILABLE) {
                showError(MSG.SMS_DOWN);
            } else {
                showError(err.message || MSG.GENERIC);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (secondsLeft > 0 || loading) return;
        setApiError("");
        setOtpError("");
        setOtpKey((k) => k + 1);
        setLoading(true);
        try {
            await requestCode();
            setSecondsLeft(OTP.COOLDOWN_SECONDS);
        } catch (err) {
            showError(err.message || MSG.GENERIC);
        } finally {
            setLoading(false);
        }
    };

    const backToOtp = async (message) => {
        showNotice(message);
        setOtpKey((k) => k + 1);
        setOtp("");
        setStep(2);
        try {
            await requestCode();
            setSecondsLeft(OTP.COOLDOWN_SECONDS);
        } catch {
            setSecondsLeft(0);
        }
    };

    // ── مرحله ۲: تأیید کد ──
    const handleVerify = async (e) => {
        e.preventDefault();
        setApiError("");
        setOtpError("");
        setLoading(true);
        try {
            await authService.verifyOtp({
                action: "register",
                otp,
                phone_number: toEnglishDigits(phone).trim(),
            });
            setVerifiedAt(Date.now());
            setStep(3);
        } catch (err) {
            if (err.status === HTTP.CONFLICT) {
                // ۴۰۹ یعنی کد منقضی شده، نه شماره تکراری
                backToOtp(MSG.OTP_EXPIRED);
            } else if (
                err.status === HTTP.BAD_REQUEST ||
                err.status === HTTP.UNAUTHORIZED
            ) {
                setOtpError(MSG.OTP_WRONG);
            } else {
                showError(err.message || MSG.GENERIC);
            }
        } finally {
            setLoading(false);
        }
    };

    const setField = (name) => (e) => {
        setForm((f) => ({ ...f, [name]: e.target.value }));
        setFieldErrors((fe) => ({ ...fe, [name]: "" }));
    };

    const validateForm = () => {
        const errors = {};
        if (form.username.trim().length < 3) errors.username = "نام کاربری حداقل ۳ کاراکتر باشد";
        if (!isValidEmail(form.email)) errors.email = "ایمیل معتبر وارد کنید";
        if (form.password.length < 8) errors.password = "رمز عبور حداقل ۸ کاراکتر باشد";
        if (!form.first_name.trim()) errors.first_name = "نام را وارد کنید";
        if (!form.last_name.trim()) errors.last_name = "نام خانوادگی را وارد کنید";
        if (!isValidNationalId(form.national_code))
            errors.national_code = "کد ملی باید ۱۰ رقم باشد";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /* تأیید هویت — نیازمند لاگین است، پس فقط بعد از register صدا زده می‌شود */
    const submitIdentity = async () => {
        const result = await authService.verifyIdentity({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            national_id: toEnglishDigits(form.national_code).trim(),
            company_id: form.organization.trim() || null,
        });

        // پاسخ ۲۰۲ یک لایه ApiResponse اضافه دارد
        const payload = result?.data ?? result;

        if (payload?.verified === false) {
            // شماره هنوز تأیید نشده — در این مسیر نباید رخ دهد چون OTP
            // پیش از ثبت‌نام انجام شده است.
            console.warn("[AUTH] شماره تأیید نشده است:", payload?.message);
        }
    };

    // ── مرحله ۳: ثبت‌نام و تأیید هویت ──
    const handleRegister = async (e) => {
        e.preventDefault();
        setApiError("");
        if (!validateForm()) return;

        if (!registeredRef.current && Date.now() - verifiedAt > OTP.EXPIRY_MS) {
            backToOtp(MSG.OTP_EXPIRED);
            return;
        }

        setLoading(true);
        try {
            // گام اول — فقط یک‌بار اجرا می‌شود
            if (!registeredRef.current) {
                const data = await authService.register({
                    username: form.username.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    phone_number: toEnglishDigits(phone).trim(),
                });
                setAuth(data);
                registeredRef.current = true;
            }

            // گام دوم — تأیید کد ملی (کاربر اکنون لاگین است)
            await submitIdentity();
            navigate("/", { replace: true });
        } catch (err) {
            // پس از ثبت‌نام موفق، خطاها مربوط به تأیید هویت‌اند
            if (registeredRef.current) {
                if (
                    err.status === HTTP.VALIDATION_ERROR ||
                    err.status === HTTP.BAD_REQUEST ||
                    err.status === HTTP.CONFLICT
                ) {
                    const raw = parseValidationErrors(err.details);
                    const mapped = {};
                    Object.entries(raw).forEach(([key, message]) => {
                        const target = key in FIELD_MAP ? FIELD_MAP[key] : key;
                        if (target) mapped[target] = message;
                    });
                    setFieldErrors(
                        Object.keys(mapped).length
                            ? mapped
                            : { national_code: MSG.NATIONAL_ID_INVALID }
                    );
                    showError(MSG.NATIONAL_ID_INVALID);
                } else {
                    showError(err.message || MSG.GENERIC);
                }
                return;
            }

            // خطاهای خودِ ثبت‌نام
            if (err.status === HTTP.UNAUTHORIZED || err.status === HTTP.FORBIDDEN) {
                backToOtp(MSG.OTP_EXPIRED);
            } else if (
                err.status === HTTP.VALIDATION_ERROR ||
                err.status === HTTP.CONFLICT
            ) {
                const raw = parseValidationErrors(err.details);
                const mapped = {};
                let orphan = "";

                Object.entries(raw).forEach(([key, message]) => {
                    const target = key in FIELD_MAP ? FIELD_MAP[key] : key;
                    if (target) mapped[target] = message;
                    else orphan = message;
                });

                if (Object.keys(mapped).length > 0) setFieldErrors(mapped);
                showError(orphan || (Object.keys(mapped).length ? "" : err.message));
            } else {
                showError(err.message || MSG.GENERIC);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Alert variant={alertVariant} onClose={() => setApiError("")}>
                {apiError}
            </Alert>

            {step === 1 && (
                <CardLayout onBack={() => navigate("/")}>
                    <h1 className={styles.title}>شماره تلفن خود را وارد کنید!</h1>
                    <form className={styles.form} onSubmit={handleSendCode} noValidate>
                        <Input
                            type="tel"
                            placeholder="شماره تلفن"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            autoComplete="tel"
                            autoFocus
                        />
                        <Button type="submit" loading={loading} disabled={!isValidPhone(phone)}>
                            ارسال کد
                        </Button>
                    </form>
                    <p className={styles.footerText}>
                        قبلا ثبت نام کرده اید؟{" "}
                        <Link to="/login" className={styles.link}>
                            همین حالا وارد شوید
                        </Link>
                    </p>
                </CardLayout>
            )}

            {step === 2 && (
                <CardLayout onBack={() => setStep(1)}>
                    <h1 className={styles.title}>کد ارسال شده را وارد کنید!</h1>
                    <form className={styles.form} onSubmit={handleVerify} noValidate>
                        <OtpInput
                            key={otpKey}
                            length={OTP.LENGTH}
                            onChange={setOtp}
                            error={otpError}
                        />
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={otp.length !== OTP.LENGTH}
                        >
                            بعدی
                        </Button>
                    </form>
                    <p className={styles.footerText}>
                        {secondsLeft > 0 ? (
                            <>ارسال مجدد کد تا {secondsLeft} ثانیه دیگر</>
                        ) : (
                            <button type="button" className={styles.linkButton} onClick={handleResend}>
                                ارسال مجدد کد
                            </button>
                        )}
                    </p>
                </CardLayout>
            )}

            {step === 3 && (
                <CardLayout wide showLogo onBack={null}>
                    <h1 className={styles.title}>ثبت اطلاعات</h1>
                    <form className={styles.wideForm} onSubmit={handleRegister} noValidate>
                        <div className={styles.grid}>
                            <Input
                                label="* نام کاربری"
                                value={form.username}
                                onChange={setField("username")}
                                error={fieldErrors.username}
                                autoComplete="username"
                            />
                            <Input
                                label="* کد ملی"
                                inputMode="numeric"
                                maxLength={10}
                                value={form.national_code}
                                onChange={setField("national_code")}
                                error={fieldErrors.national_code}
                            />
                            <Input
                                label="* نام"
                                persian
                                value={form.first_name}
                                onChange={setField("first_name")}
                                error={fieldErrors.first_name}
                            />
                            <Input
                                label="* ایمیل"
                                type="email"
                                value={form.email}
                                onChange={setField("email")}
                                error={fieldErrors.email}
                                autoComplete="email"
                            />
                            <Input
                                label="* نام خانوادگی"
                                persian
                                value={form.last_name}
                                onChange={setField("last_name")}
                                error={fieldErrors.last_name}
                            />
                            <Input
                                label="* رمز عبور"
                                type="password"
                                value={form.password}
                                onChange={setField("password")}
                                error={fieldErrors.password}
                                autoComplete="new-password"
                            />
                            <Input label="* شماره موبایل" value={phone} readOnly disabled />
                            <Input
                                label="نام سازمان"
                                persian
                                value={form.organization}
                                onChange={setField("organization")}
                                error={fieldErrors.organization}
                            />
                        </div>
                        <Button type="submit" loading={loading} className={styles.submitWide}>
                            ثبت نام
                        </Button>
                    </form>
                </CardLayout>
            )}
        </>
    );
}