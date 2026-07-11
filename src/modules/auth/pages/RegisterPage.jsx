import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CardLayout from "../components/CardLayout/CardLayout";
import OtpInput from "../components/OtpInput/OtpInput";
import Input from "../../../components/ui/Input/Input";
import Button from "../../../components/ui/Button/Button";
import Alert from "../../../components/ui/Alert/Alert";
import { authService } from "../../../services/authService";
import { useAuthStore } from "../../../store/authStore";
import styles from "./RegisterPage.module.css";

const OTP_LENGTH = 5;
const RESEND_SECONDS = 120;
const CLAIM_TTL_MS = 5 * 60 * 1000; // عمر claim_token در بک‌اند ۳۰۰ ثانیه است

const isValidPhone = (v) => /^(\+98|0)?9\d{9}$/.test(v.trim());
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    // مرحله ۱
    const [phone, setPhone] = useState("");

    // مرحله ۲
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [otpKey, setOtpKey] = useState(0); // برای ریست خانه‌ها بعد از ارسال مجدد
    const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

    // مرحله ۳
    const [claim, setClaim] = useState({ token: null, issuedAt: 0 });
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

    // شمارنده‌ی معکوس ارسال مجدد
    useEffect(() => {
        if (step !== 2 || secondsLeft <= 0) return;
        const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [step, secondsLeft]);

    const requestCode = async () => {
        const data = await authService.requestOtp({
            action: "register",
            phone_number: phone.trim(),
        });
        // در محیط dev (بدون سرویس پیامک) کد داخل پاسخ برمی‌گردد
        if (data?.otp) console.info("[DEV] کد تأیید:", data.otp);
    };

    // ── مرحله ۱: ارسال کد ──
    const handleSendCode = async (e) => {
        e.preventDefault();
        setApiError("");
        setLoading(true);
        try {
            await requestCode();
            setSecondsLeft(RESEND_SECONDS);
            setStep(2);
        } catch (err) {
            if (err.status === 409) {
                setApiError("این شماره قبلاً ثبت‌نام کرده است. می‌توانید وارد شوید.");
            } else if (err.status === 429) {
                setApiError("تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره امتحان کنید.");
            } else {
                setApiError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (secondsLeft > 0 || loading) return;
        setApiError("");
        setOtpError("");
        setOtpKey((k) => k + 1); // خانه‌های کد خالی شوند
        setLoading(true);
        try {
            await requestCode();
            setSecondsLeft(RESEND_SECONDS);
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── مرحله ۲: تأیید کد ──
    const handleVerify = async (e) => {
        e.preventDefault();
        setApiError("");
        setOtpError("");
        setLoading(true);
        try {
            const data = await authService.verifyOtp({
                action: "register",
                otp,
                phone_number: phone.trim(),
            });
            setClaim({ token: data.claim_token, issuedAt: Date.now() });
            setStep(3);
        } catch (err) {
            if (err.status === 400 || err.status === 401) {
                setOtpError("کد وارد شده صحیح نمی باشد");
            } else {
                setApiError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // ── مرحله ۳: ثبت اطلاعات ──
    const setField = (name) => (e) => {
        setForm((f) => ({ ...f, [name]: e.target.value }));
        setFieldErrors((fe) => ({ ...fe, [name]: "" }));
    };

    const validateForm = () => {
        const errors = {};
        if (form.username.trim().length < 3) errors.username = "نام کاربری حداقل ۳ کاراکتر باشد";
        if (!isValidEmail(form.email)) errors.email = "ایمیل معتبر وارد کنید";
        if (form.password.length < 8) errors.password = "رمز عبور حداقل ۸ کاراکتر باشد";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // بازگشت به مرحله‌ی کد وقتی claim منقضی شده
    const backToOtp = async (message) => {
        setApiError(message);
        setOtpKey((k) => k + 1);
        setOtp("");
        setStep(2);
        try {
            await requestCode();
            setSecondsLeft(RESEND_SECONDS);
        } catch {
            setSecondsLeft(0);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setApiError("");
        if (!validateForm()) return;

        if (Date.now() - claim.issuedAt > CLAIM_TTL_MS) {
            backToOtp("مهلت ۵ دقیقه‌ای تمام شد؛ کد جدید برایتان ارسال شد.");
            return;
        }

        setLoading(true);
        try {
            // TODO: فیلدهای first_name / last_name / national_code / organization
            // فعلاً در RegisterInput بک‌اند وجود ندارند (به فایل نکات بک‌اند مراجعه شود)
            const data = await authService.register(
                {
                    username: form.username.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    phone_number: phone.trim(),
                },
                claim.token
            );
            setAuth(data);
            navigate("/", { replace: true });
        } catch (err) {
            if (err.status === 401 || err.status === 403) {
                backToOtp("مهلت تأیید تمام شد؛ کد جدید برایتان ارسال شد.");
            } else if (err.status === 409) {
                setApiError("نام کاربری یا ایمیل قبلاً ثبت شده است.");
            } else {
                setApiError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // ── رندر مراحل ──
    return (
        <>
            <Alert onClose={() => setApiError("")}>{apiError}</Alert>

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
                            length={OTP_LENGTH}
                            onChange={setOtp}
                            error={otpError}
                        />
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={otp.length !== OTP_LENGTH}
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
                                label="کد ملی"
                                inputMode="numeric"
                                value={form.national_code}
                                onChange={setField("national_code")}
                            />
                            <Input
                                label="نام"
                                persian
                                value={form.first_name}
                                onChange={setField("first_name")}
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
                                label="نام خانوادگی"
                                persian
                                value={form.last_name}
                                onChange={setField("last_name")}
                            />
                            <Input
                                label="* رمز عبور"
                                type="password"
                                value={form.password}
                                onChange={setField("password")}
                                error={fieldErrors.password}
                                autoComplete="new-password"
                            />
                            <Input label="* شماره موبایل" value={phone} disabled />
                            <Input
                                label="نام سازمان"
                                persian
                                value={form.organization}
                                onChange={setField("organization")}
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