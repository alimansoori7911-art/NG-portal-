import styles from "./Input.module.css";

export default function Input({ error, className = "", ...props }) {
    return (
        <div className={styles.wrapper}>
            <input
                className={`${styles.input} ${error ? styles.hasError : ""} ${className}`}
                aria-invalid={Boolean(error)}
                {...props}
            />
            {error && error.trim() && (
                <p className={styles.errorText} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}