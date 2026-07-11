import { useEffect, useRef, useState } from "react";
import styles from "./OtpInput.module.css";

/**
 * ورودی کد تأیید با خانه‌های جدا.
 *  length: تعداد رقم‌ها
 *  onChange: با هر تغییر، رشته‌ی رقم‌های واردشده را می‌دهد
 *  error: قاب‌ها را قرمز و پیام را زیر خانه‌ها نشان می‌دهد
 * نکته: برای ریست کردن (مثلاً بعد از ارسال مجدد کد) از prop استاندارد
 * key در والد استفاده کنید تا کامپوننت از نو ساخته شود.
 */
export default function OtpInput({ length = 5, onChange, error }) {
    const [digits, setDigits] = useState(Array(length).fill(""));
    const refs = useRef([]);

    useEffect(() => {
        onChange?.(digits.join(""));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [digits]);

    const focusBox = (i) => refs.current[i]?.focus();

    const setDigitsFrom = (startIndex, chars) => {
        setDigits((prev) => {
            const next = [...prev];
            chars.slice(0, length - startIndex).forEach((ch, k) => {
                next[startIndex + k] = ch;
            });
            return next;
        });
    };

    const handleChange = (i, raw) => {
        const nums = raw.replace(/\D/g, "");
        if (!nums) return;
        setDigitsFrom(i, nums.split(""));
        focusBox(Math.min(i + nums.length, length - 1));
    };

    const handleKeyDown = (i, e) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            setDigits((prev) => {
                const next = [...prev];
                if (next[i]) {
                    next[i] = "";
                } else if (i > 0) {
                    next[i - 1] = "";
                    focusBox(i - 1);
                }
                return next;
            });
        }
        if (e.key === "ArrowLeft" && i > 0) focusBox(i - 1);
        if (e.key === "ArrowRight" && i < length - 1) focusBox(i + 1);
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const nums = e.clipboardData.getData("text").replace(/\D/g, "");
        if (!nums) return;
        setDigitsFrom(0, nums.split(""));
        focusBox(Math.min(nums.length, length - 1));
    };

    return (
        <div className={styles.wrapper}>
            {/* رقم اول کد باید سمت چپ باشد، پس این ردیف LTR است */}
            <div className={styles.boxes} dir="ltr">
                {digits.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => (refs.current[i] = el)}
                        className={`${styles.box} ${error ? styles.hasError : ""}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={length}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        onFocus={(e) => e.target.select()}
                        aria-label={`رقم ${i + 1} کد تأیید`}
                        autoFocus={i === 0}
                    />
                ))}
            </div>
            {error && (
                <p className={styles.errorText} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}