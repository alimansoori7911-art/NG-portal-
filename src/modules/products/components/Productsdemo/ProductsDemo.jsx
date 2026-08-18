import { useEffect, useRef, useState } from 'react'
import styles from './ProductsDemo.module.css'

/**
 * بخش درخواست دمو.
 *
 * onRequestDemo / loading اختیاری‌اند: اگر صفحه‌ی والد آن‌ها را ندهد،
 * دکمه فقط ظاهر است (رفتار قبلی). با اتصال به POST /orders/demo
 * والد این دو را پاس می‌دهد.
 */
function ProductsDemo({ onRequestDemo, loading = false }) {
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
                        disabled={loading}
                    >
                        {loading ? 'در حال ارسال…' : 'درخواست دمو'}
                    </button>
                </div>
            </div>
        </section>
    )
}

export default ProductsDemo