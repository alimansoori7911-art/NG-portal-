import styles from './Alert.module.css'


export default function Alert({ children, onClose, variant = 'error' }) {
    if (!children) return null

    return (
        <div className={`${styles.alert} ${styles[variant]}`} role="alert">
            <span>{children}</span>
            {onClose && (
                <button
                    type="button"
                    className={styles.close}
                    onClick={onClose}
                    aria-label="بستن پیام"
                >
                    ✕
                </button>
            )}
        </div>
    )
}