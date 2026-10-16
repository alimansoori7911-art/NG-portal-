import { useId } from "react";
import styles from "./Textarea.module.css";

/**
 * متن چندخطی با برچسب شناور — همان اصلاح `Input`:
 * برچسب قبلاً به فیلد وصل نبود.
 */

export default function Textarea({
                                     label,
                                     error,
                                     rows = 6,
                                     className = "",
                                     placeholder,
                                     id,
                                     ...props
                                 }) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const errorId = `${fieldId}-error`;
    const floating = Boolean(label);
    const hasError = Boolean(error && error.trim());

    const textareaClass = [
        styles.textarea,
        floating ? styles.floating : "",
        error ? styles.hasError : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={styles.wrapper}>
            <div className={styles.field}>
                <textarea
                    {...props}
                    id={fieldId}
                    rows={rows}
                    className={textareaClass}
                    placeholder={floating ? " " : placeholder}
                    aria-invalid={Boolean(error)}
                    aria-describedby={hasError ? errorId : undefined}
                />
                {floating && (
                    <label className={styles.label} htmlFor={fieldId}>
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