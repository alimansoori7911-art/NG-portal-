import { useEffect, useRef, useState } from "react";
import { KeyRound, X } from "lucide-react";
import Input from "../../../../components/ui/Input/Input";
import Button from "../../../../components/ui/Button/Button";
import { authService } from "../../../../services/authService";
import { HTTP, MSG, OTP, toEnglishDigits } from "../../../../constants/auth";
import OtpInput from "../OtpInput/OtpInput";
import styles from "./SetPasswordModal.module.css";

const MIN_PASSWORD_LENGTH = 8;

/**
 * انتخاب رمز عبور بعد از ثبت‌نام با شماره.
 *
 * ⚠️ چرا از مسیر «تغییر رمز» استفاده نمی‌کنیم:
 * `POST /auth/password/change` فیلد `old_password` را **اجباری**
 * می‌خواهد، ولی کاربری که با شماره ثبت‌نام کرده اصلاً رمزی ندارد که
 * بدهد. پس همان مسیر بازیابی رمز به‌کار می‌رود که رمز قبلی نمی‌خواهد:
 *
 *   ۱. `POST /auth/otp/request`  با action=reset_password
 *   ۲. `POST /auth/otp/reset-password/verify`  → توکن یک‌بارمصرف
 *   ۳. `POST /auth/password/reset`  { reset_token, new_password }
 *
 * `onClose` یعنی «الان نه»؛ کاربر همچنان با کد یک‌بارمصرف وارد می‌شود
 * و رمز اجباری نیست.
 */
export default function SetPasswordModal({ phone, onClose, onDone }) {
    /* 'otp' → کد تأیید، 'password' → انتخاب رمز */
    const [stage, setStage] = useState("otp");
    const [otp, setOtp] = useState("");
    const [otpKey, setOtpKey] = useState(0);
    const [token, setToken] = useState(null);

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldError, setFieldError] = useState("");

    /* کد فقط یک‌بار در باز شدن مودال فرستاده می‌شود. بدون این نگهبان،
       در StrictMode دوبار درخواست می‌رفت و کد اول باطل می‌شد. */
    const requestedRef = useRef(false);
    const dialogRef = useRef(null);

    useEffect(() => {
        if (requestedRef.current) return;
        requestedRef.current = true;

        async function requestCode() {
            setLoading(true);
            try {
                await authService.requestOtp({
                    action: "reset_password",
                    phone_number: toEnglishDigits(phone).trim(),
                });
            } catch (err) {
                setError(err?.message || MSG.GENERIC);
            } finally {
                setLoading(false);
            }
        }

        requestCode();
    }, [phone]);

    /* Esc برای بستن — انتظار استاندارد هر مودالی است */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await authService.verifyResetOtp({
                otp,
                phone_number: toEnglishDigits(phone).trim(),
            });

            /* بسته به نسخه، توکن با یکی از این دو نام می‌آید — همان
               رفتاری که صفحه‌ی «فراموشی رمز» هم دارد. */
            const next = data?.claim_token ?? data?.reset_token ?? null;
            if (!next) {
                setError("توکن تغییر رمز دریافت نشد. دوباره تلاش کنید.");
                return;
            }

            setToken(next);
            setStage("password");
        } catch (err) {
            if (
                err.status === HTTP.UNAUTHORIZED ||
                err.status === HTTP.BAD_REQUEST ||
                err.status === HTTP.NOT_FOUND
            ) {
                setError(MSG.OTP_WRONG);
                setOtpKey((k) => k + 1);
                setOtp("");
            } else {
                setError(err?.message || MSG.GENERIC);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");
        setFieldError("");

        if (password.length < MIN_PASSWORD_LENGTH) {
            setFieldError("رمز عبور حداقل ۸ کاراکتر باشد");
            return;
        }
        if (password !== confirm) {
            setFieldError("تکرار رمز عبور یکسان نیست");
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword({ token, new_password: password });
            onDone?.();
        } catch (err) {
            setError(err?.message || MSG.GENERIC);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={styles.overlay}
            /* کلیک روی پس‌زمینه می‌بندد، ولی کلیک داخل کادر نه */
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div
                className={styles.dialog}
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="set-password-title"
            >
                <button
                    type="button"
                    className={styles.close}
                    onClick={onClose}
                    aria-label="بستن"
                >
                    <X size={18} />
                </button>

                <span className={styles.icon} aria-hidden="true">
                    <KeyRound size={26} />
                </span>

                <h2 id="set-password-title" className={styles.title}>
                    انتخاب رمز عبور
                </h2>

                {stage === "otp" ? (
                    <>
                        <p className={styles.text}>
                            برای تعیین رمز، کدی که به شماره‌ی{" "}
                            <span className={styles.phone}>{phone}</span> ارسال
                            شد را وارد کنید.
                        </p>

                        <form className={styles.form} onSubmit={handleVerify}>
                            <OtpInput
                                key={otpKey}
                                length={OTP.LENGTH}
                                onChange={setOtp}
                            />

                            {error && (
                                <p className={styles.error} role="alert">
                                    {error}
                                </p>
                            )}

                            <Button
                                type="submit"
                                loading={loading}
                                disabled={otp.length < OTP.LENGTH}
                            >
                                تأیید کد
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
                        <p className={styles.text}>
                            رمز دلخواه خود را وارد کنید. حداقل ۸ کاراکتر.
                        </p>

                        <form className={styles.form} onSubmit={handleSave}>
                            <Input
                                label="رمز عبور جدید"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setFieldError("");
                                }}
                                autoComplete="new-password"
                            />
                            <Input
                                label="تکرار رمز عبور"
                                type="password"
                                value={confirm}
                                onChange={(e) => {
                                    setConfirm(e.target.value);
                                    setFieldError("");
                                }}
                                error={fieldError}
                                autoComplete="new-password"
                            />

                            {error && (
                                <p className={styles.error} role="alert">
                                    {error}
                                </p>
                            )}

                            <Button type="submit" loading={loading}>
                                ذخیره رمز
                            </Button>
                        </form>
                    </>
                )}

                <button type="button" className={styles.skip} onClick={onClose}>
                    فعلاً نه، بعداً تنظیم می‌کنم
                </button>
            </div>
        </div>
    );
}
