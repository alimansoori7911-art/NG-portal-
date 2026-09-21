import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import ctaImage from '../../../../assets/images/illustrations/cta-question.svg'
import styles from './CtaBox.module.css'

/**
 * باکس «سؤالی دارید؟» — در هر سه صفحه‌ی عمومی با متن متفاوت.
 *
 * دکمه‌ها `Link` هستند نه `Button`: این‌ها ناوبری‌اند نه عملیات، و
 * `Button` پروژه هم `width: 100%` دارد که برای فرم ساخته شده.
 *
 * `imageSide` جای تصویر را تعیین می‌کند — اسپک در صفحه‌ی منابع آن را
 * سمت چپ و در قوانین و خدمات سمت راست گذاشته.
 */
export default function CtaBox({
    title,
    description,
    primaryLabel,
    primaryTo,
    secondaryLabel,
    secondaryTo,
    imageSide = 'start',
}) {
    return (
        <section
            className={`${styles.box} ${imageSide === 'end' ? styles.imageEnd : ''}`}
        >
            <img
                src={ctaImage}
                alt=""
                aria-hidden="true"
                className={styles.image}
            />

            <div className={styles.content}>
                <h2 className={styles.title}>{title}</h2>
                {description && <p className={styles.description}>{description}</p>}

                <div className={styles.actions}>
                    {primaryLabel && primaryTo && (
                        <Link to={primaryTo} className={styles.primary}>
                            {primaryLabel}
                            <ArrowLeft size={18} aria-hidden="true" />
                        </Link>
                    )}
                    {secondaryLabel && secondaryTo && (
                        <Link to={secondaryTo} className={styles.secondary}>
                            {secondaryLabel}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    )
}
