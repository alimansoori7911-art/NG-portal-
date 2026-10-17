import { useEffect, useRef, useState } from 'react'
import styles from './ProductIntro.module.css'
import productImage from '../../../../assets/images/sections/product-intro.png'

function ProductIntro({ cms }) {
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

    /* متن از CMS — متن فعلی پیش‌فرض می‌ماند */
    const intro = cms?.fields?.('product_intro', {
        section_title: 'معرفی محصول',
        heading: 'پلتفرم مدیریت انطباق امنیتی و تحلیل ریسک زیر ساخت',
        body:
            'با ترکیب دید متمرکز، مسیر مستمر و مقاوم سازی خودکار و تحلیل ریسک، به سازمان‌ها کمک می‌کند وضعیت امنیتی زیر ساخت خود را به صورت خودکار اداره، گزارش و بهبود دهند.',
    }) ?? {}

    return (
        <section id="product-intro" className={styles.section}>
            <h2 className={styles.mainTitle}>{intro.section_title}</h2>

            <div className={styles.imageWrapper}>
                <img
                    ref={imgRef}
                    src={productImage}
                    alt="معرفی محصول NGcorion"
                    className={`${styles.image} ${visible ? styles.visible : ''}`}
                />
            </div>

            <div className={styles.textWrapper}>
                <h3 className={styles.subtitle}>{intro.heading}</h3>
                <p className={styles.description}>{intro.body}</p>
            </div>
        </section>
    )
}

export default ProductIntro