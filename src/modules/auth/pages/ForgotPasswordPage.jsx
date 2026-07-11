import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, CircleCheckBig } from "lucide-react";
import CardLayout from "../components/CardLayout/CardLayout";
import OtpInput from "../components/OtpInput/OtpInput";
import Input from "../../../components/ui/Input/Input";
import Button from "../../../components/ui/Button/Button";
import Alert from "../../../components/ui/Alert/Alert";
import { authService } from "../../../services/authService";
import styles from "./ForgotPasswordPage.module.css";

const OTP_LENGTH = 5;
const RESEND_SECONDS = 120;
const RESET_TTL_MS = 5 * 60 * 1000; // عمر reset_token در بک‌اند ۳۰۰ ثانیه است

const isValidPhone = (v) => /^(\+98|0)?9\d{9}$/.test(v.trim());
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/* تشخیص ایمیل یا شماره برای ارسال فیلد درست به بک‌اند */
function buildIdentifier(value) {
    const v = value.trim();
    if (isValidEmail(v)) return { email: v };
    if (isValidPhone(v)) return { phone_number: v };
    return null;
}

export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: شناسه، 2: کد، 3: رمز جدید، 4: موفقیت
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    const [identifier, setIdentifier] = useState("");
    const [identifierError, setIdentifierError] = useState("");

    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [otpKey, setOtpKey] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

    const [reset, setReset] = useState({ token: null, issuedAt: 0 });
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [passwordErrors, setPasswordErrors] = useState({});

    useEffect(() => {
        if (step !== 2 || secondsLeft <= 0) return;
        const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [step, secondsLeft]);

    const requestCode = async () => {
        const data = await authService.requestOtp({
            action: "reset_password",
            ...buildIdentifier(identifier),
        });
        if (data?.otp) console.info("[DEV] کد تأیید:", data.otp);
    };

    // ── مرحله ۱: شناسه ──
    const handleSend = async (e) => {
        e.preventDefault();
        setApiError("");
        if (!buildIdentifier(identifier)) {
            setIdentifierError("ایمیل یا شماره تلفن معتبر وارد کنید");
            return;
        }
        setIdentifierError("");
        setLoading(true);
        try {
            await requestCode();
            setSecondsLeft(RESEND_SECONDS);
            setStep(2);
        } catch (err) {
            if (err.status === 404) {
                setIdentifierError("حسابی با این مشخصات پیدا نشد");
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
        setOtpKey((k) => k + 1);
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
                action: "reset_password",
                otp,
                ...buildIdentifier(identifier),
            });
            setReset({ token: data.reset_token, issuedAt: Date.now() });
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

    // ── مرحله ۳: رمز جدید ──
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

    const handleReset = async (e) => {
        e.preventDefault();
        setApiError("");

        const errors = {};
        if (password.length < 8) errors.password = "رمز عبور حداقل ۸ کاراکتر باشد";
        if (confirm !== password) errors.confirm = "تکرار رمز عبور یکسان نیست";
        setPasswordErrors(errors);
        if (Object.keys(errors).length > 0) return;

        if (Date.now() - reset.issuedAt > RESET_TTL_MS) {
            backToOtp("مهلت ۵ دقیقه‌ای تمام شد؛ کد جدید برایتان ارسال شد.");
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword({
                reset_token: reset.token,
                new_password: password,
            });
            setStep(4);
        } catch (err) {
            if (err.status === 401 || err.status === 403) {
                backToOtp("مهلت تأیید تمام شد؛ کد جدید برایتان ارسال شد.");
            } else {
                setApiError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Alert onClose={() => setApiError("")}>{apiError}</Alert>

            {step === 1 && (
                <CardLayout wide showLogo onBack={() => navigate("/login")}>
                    <LockKeyhole className={styles.icon} size={52} strokeWidth={1.8} />
                    <h1 className={styles.title}>بازیابی رمز عبور</h1>
                    <p className={styles.description}>
                        ایمیلی یا شماره تلفنی که آن را در حساب پرتال ثبت کرده اید را وارد
                        کنید تا کد بازیابی رمز عبور برای شما ارسال شود.
                    </p>
                    <form className={styles.form} onSubmit={handleSend} noValidate>
                        <Input
                            type="text"
                            placeholder="ایمیل یا شماره تلفن"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            error={identifierError}
                            autoComplete="username"
                            autoFocus
                        />
                        <Button type="submit" loading={loading} disabled={!identifier.trim()}>
                            بازیابی رمز عبور
                        </Button>
                    </form>
                </CardLayout>
            )}

            {step === 2 && (
                <CardLayout wide showLogo onBack={() => setStep(1)}>
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
                    <LockKeyhole className={styles.icon} size={52} strokeWidth={1.8} />
                    <h1 className={styles.title}>رمز عبور جدید</h1>
                    <p className={styles.description}>
                        رمز عبور جدید حساب خود را وارد کنید. رمز باید حداقل ۸ کاراکتر باشد.
                    </p>
                    <form className={styles.form} onSubmit={handleReset} noValidate>
                        <Input
                            label="رمز عبور جدید"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={passwordErrors.password}
                            autoComplete="new-password"
                            autoFocus
                        />
                        <Input
                            label="تکرار رمز عبور"
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            error={passwordErrors.confirm}
                            autoComplete="new-password"
                        />
                        <Button type="submit" loading={loading}>
                            تغییر رمز عبور
                        </Button>
                    </form>
                </CardLayout>
            )}

            {step === 4 && (
                <CardLayout wide showLogo onBack={null}>
                    <CircleCheckBig className={styles.icon} size={52} strokeWidth={1.8} />
                    <h1 className={styles.title}>رمز عبور با موفقیت تغییر کرد</h1>
                    <p className={styles.description}>
                        اکنون می‌توانید با رمز عبور جدید وارد حساب خود شوید.
                    </p>
                    <div className={styles.form}>
                        <Button onClick={() => navigate("/login")}>ورود به حساب</Button>
                    </div>
                </CardLayout>
            )}
        </>
    );
}