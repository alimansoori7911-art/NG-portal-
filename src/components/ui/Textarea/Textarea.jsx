import styles from "./Textarea.module.css";

export default function Textarea({
                                     label,
                                     error,
                                     rows = 6,
                                     className = "",
                                     placeholder,
                                     ...props
                                 }) {
    const floating = Boolean(label);

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
                    rows={rows}
                    className={textareaClass}
                    placeholder={floating ? " " : placeholder}
                    aria-invalid={Boolean(error)}
                />
                {floating && <label className={styles.label}>{label}</label>}
            </div>
            {error && error.trim() && (
                <p className={styles.errorText} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}