import { useId } from "react";
import styles from "./Input.module.css";

/**
 * ورودی با برچسب شناور.
 *
 * ⚠️ `placeholder=" "` عمدی است: ترفند CSS برچسب شناور روی
 * `:placeholder-shown` کار می‌کند و بدون یک فاصله، برچسب همیشه بالا
 * می‌ماند.
 *
 * ⚠️ برچسب قبلاً به input **وصل نبود** (نه `htmlFor` نه تودرتو). یعنی
 * screen reader فیلد را بی‌نام می‌خواند و کلیک روی برچسب فوکوس
 * نمی‌داد. حالا با `useId` به هم وصل‌اند.
 */
export default function Input({
                                  label,
                                  error,
                                  persian = false,
                                  className = "",
                                  placeholder,
                                  id,
                                  ...props
                              }) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const floating = Boolean(label);
    const hasError = Boolean(error && error.trim());

    const inputClass = [
        styles.input,
        floating ? styles.floating : "",
        persian ? styles.persian : "",
        error ? styles.hasError : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={styles.wrapper}>
            <div className={styles.field}>
                <input
                    {...props}
                    id={inputId}
                    className={inputClass}
                    placeholder={floating ? " " : placeholder}
                    aria-invalid={Boolean(error)}
                    /* پیام خطا را هم به فیلد وصل می‌کنیم تا همراه نامش
                       خوانده شود، نه جدا و بی‌ارتباط. */
                    aria-describedby={hasError ? errorId : undefined}
                />
                {floating && (
                    <label className={styles.label} htmlFor={inputId}>
                        {label}
                    </label>
                )}
            </div>
            {hasError && (
                <p className={styles.errorText} id={errorId} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
