import { useEffect, useRef, useState } from 'react'
import styles from './ProductsDemo.module.css'

function ProductsDemo() {
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

                <div className={styles.buttons}>
                    <button type="button" className={styles.demoBtn}>
                        دمو آنلاین
                    </button>
                    <button type="button" className={styles.demoBtn}>
                        دمو آفلاین
                    </button>
                </div>
            </div>
        </section>
    )
}

export default ProductsDemo