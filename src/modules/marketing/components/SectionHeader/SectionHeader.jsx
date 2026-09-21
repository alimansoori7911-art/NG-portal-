import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './SectionHeader.module.css'

/**
 * عنوان سکشن — در هر سه صفحه‌ی عمومی (قوانین، خدمات، منابع).
 *
 * دو حالت دارد (طبق اسپک دیزاین):
 *  - `align="start"` راست‌چین، با لینک اختیاری «مشاهده همه» در سمت چپ
 *  - `align="center"` وسط‌چین و کمی درشت‌تر (صفحه‌ی خدمات)
 *
 * `action` برای وقتی است که مقصد هنوز صفحه ندارد — به‌جای لینک شکسته
 * چیزی نشان داده نمی‌شود. (`soon` در هدر هم همین منطق را دارد.)
 */
export default function SectionHeader({
    title,
    subtitle,
    align = 'start',
    actionLabel,
    actionTo,
}) {
    return (
        <header
            className={`${styles.header} ${align === 'center' ? styles.center : ''}`}
        >
            <div className={styles.text}>
                <h2 className={styles.title}>{title}</h2>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            {actionLabel && actionTo && (
                <Link to={actionTo} className={styles.action}>
                    {actionLabel}
                    <ArrowLeft size={14} aria-hidden="true" />
                </Link>
            )}
        </header>
    )
}
