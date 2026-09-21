import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '../../../../assets/images/illustrations/terms-hero.svg'
import styles from './TermsHero.module.css'

/**
 * سربرگ صفحه‌ی قوانین — breadcrumb، عنوان، و تاریخ آخرین به‌روزرسانی.
 *
 * `updatedAt` از خودِ سند فعال می‌آید، پس با عوض شدن تب (قوانین /
 * حریم خصوصی) تاریخ درست نشان داده می‌شود.
 */
export default function TermsHero({ title, subtitle, intro, updatedAt }) {
    return (
        <section className={styles.hero}>
            <div className={styles.text}>
                <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
                    <Link to="/" className={styles.crumb}>
                        خانه
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className={styles.current}>قوانین و مقررات</span>
                </nav>

                <h1 className={styles.title}>{title}</h1>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                {intro && <p className={styles.intro}>{intro}</p>}

                <p className={styles.meta}>
                    <span className={styles.metaIcon} aria-hidden="true">
                        <CalendarDays size={16} />
                    </span>
                    آخرین به‌روزرسانی: {updatedAt}
                </p>
            </div>

            <img
                src={heroImage}
                alt=""
                aria-hidden="true"
                className={styles.image}
            />
        </section>
    )
}
