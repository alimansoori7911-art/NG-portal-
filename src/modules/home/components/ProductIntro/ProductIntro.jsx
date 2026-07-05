import { useEffect, useRef, useState } from 'react'
import styles from './ProductIntro.module.css'
import productImage from '../../../../assets/images/sections/product-intro.png'

function ProductIntro() {
    const imgRef = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.3 }
        )
        if (imgRef.current) observer.observe(imgRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <section id="product-intro" className={styles.section}>
            <h2 className={styles.mainTitle}>معرفی محصول</h2>

            <div className={styles.imageWrapper}>
                <img
                    ref={imgRef}
                    src={productImage}
                    alt="معرفی محصول NGcorion"
                    className={`${styles.image} ${visible ? styles.visible : ''}`}
                />
            </div>

            <div className={styles.textWrapper}>
                <h3 className={styles.subtitle}>
                    پلتفرم مدیریت انطباق امنیتی و تحلیل ریسک زیر ساخت
                </h3>
                <p className={styles.description}>
                    با ترکیب دید متمرکز، مسیر مستمر و مقاوم سازی خودکار و تحلیل ریسک،
                    به سازمان‌ها کمک می‌کند وضعیت امنیتی زیر ساخت خود را به صورت خودکار
                    اداره، گزارش و بهبود دهند.
                </p>
            </div>
        </section>
    )
}

export default ProductIntro