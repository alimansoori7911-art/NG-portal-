import styles from "./Button.module.css";

export default function Button({
                                   variant = "primary",
                                   loading = false,
                                   disabled,
                                   children,
                                   className = "",
                                   ...props
                               }) {
    return (
        <button
            className={`${styles.button} ${styles[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className={styles.dots} aria-label="در حال ارسال">
                    <span />
                    <span />
                    <span />
                </span>
            ) : (
                children
            )}
        </button>
    );
}