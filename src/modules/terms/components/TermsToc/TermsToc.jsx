import { ListOrdered } from 'lucide-react'
import styles from './TermsToc.module.css'

/**
 * فهرست مطالب — ستون چسبانِ کنار متن.
 *
 * بخش فعال از بیرون می‌آید (`activeId`) چون تشخیصش با
 * IntersectionObserver در صفحه انجام می‌شود، نه اینجا.
 *
 * کلیک اسکرول نرم می‌کند؛ `href` واقعی هم گذاشته شده تا بدون
 * جاوااسکریپت و با کلیک میانی/تب هم کار کند.
 */
export default function TermsToc({ sections, activeId, onSelect }) {
    return (
        <nav className={styles.box} aria-label="فهرست مطالب">
            <header className={styles.header}>
                <span className={styles.iconBox} aria-hidden="true">
                    <ListOrdered size={20} />
                </span>
                <h2 className={styles.title}>فهرست مطالب</h2>
            </header>

            <ol className={styles.list}>
                {sections.map((section) => (
                    <li key={section.id}>
                        <a
                            href={`#${section.id}`}
                            className={`${styles.item} ${
                                activeId === section.id ? styles.active : ''
                            }`}
                            aria-current={
                                activeId === section.id ? 'true' : undefined
                            }
                            onClick={(e) => {
                                e.preventDefault()
                                onSelect?.(section.id)
                            }}
                        >
                            <span className={styles.num}>{section.num}</span>
                            <span className={styles.label}>{section.title}</span>
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    )
}
