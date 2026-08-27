import { useEffect, useRef, useState } from 'react'
import styles from './ProductsDemo.module.css'

/**
 * بخش درخواست دمو — وصل به `POST /orders/demo`.
 *
 * طبق فلو دمو آزمایشی است و **فقط یک‌بار برای هر کاربر**؛ درخواست دوم
 * خودکار رد می‌شود. پس اگر کاربر از قبل دمو گرفته باشد دکمه غیرفعال
 * می‌شود و دلیلش گفته می‌شود، به‌جای اینکه تازه بعد از رد شدن بفهمد.
 *
 * کاربر مهمان به صفحه‌ی ورود هدایت می‌شود چون اندپوینت لاگین می‌خواهد.
 */
function ProductsDemo({
    onRequestDemo,
    loading = false,
    alreadyRequested = false,
    isAuthenticated = true,
    message,
    error,
}) {
    const sectionRef = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = sectionRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.35 }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <section
            ref={sectionRef}
            className={`${styles.wrapper} ${visible ? styles.visible : ''}`}
        >
            <div className={styles.inner}>
                <h2 className={styles.title}>درخواست دمو</h2>
                <p className={styles.subtitle}>
                    با درخواست دمو از امکانات نرم افزار <span dir="ltr">ng corion</span>
                    <br />
                    بهره مند شوید
                </p>

                {/* بک‌اند فقط یک POST /orders/demo دارد و تفکیک
                    آنلاین/آفلاین ندارد، پس یک دکمه بیشتر نیست. */}
                <div className={styles.buttons}>
                    <button
                        type="button"
                        className={styles.demoBtn}
                        onClick={onRequestDemo}
                        disabled={loading || alreadyRequested}
                    >
                        {loading
                            ? 'در حال ارسال…'
                            : alreadyRequested
                              ? 'دمو قبلاً درخواست شده'
                              : 'درخواست دمو'}
                    </button>
                </div>

                {/* قاعده‌ی «یک‌بار برای هر کاربر» باید *قبل* از کلیک
                    دیده شود، نه بعد از رد شدن درخواست. */}
                <p
                    className={`${styles.note} ${error ? styles.noteError : ''}`}
                    role={error ? 'alert' : undefined}
                >
                    {error ||
                        message ||
                        (!isAuthenticated
                            ? 'برای درخواست دمو ابتدا وارد حساب خود شوید.'
                            : alreadyRequested
                              ? 'هر کاربر تنها یک‌بار می‌تواند دمو دریافت کند.'
                              : 'دمو نسخه‌ی آزمایشی است و برای هر کاربر تنها یک‌بار قابل درخواست است.')}
                </p>
            </div>
        </section>
    )
}

export default ProductsDemo