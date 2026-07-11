import styles from "./Input.module.css";

export default function Input({
                                  label,
                                  error,
                                  persian = false,
                                  className = "",
                                  placeholder,
                                  ...props
                              }) {
    const floating = Boolean(label);

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
                    className={inputClass}
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