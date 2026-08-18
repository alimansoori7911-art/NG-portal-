import { ChevronDown } from 'lucide-react'
import logo from '../../../../../assets/images/logo/logo-color.png'
import styles from './NotificationCard.module.css'

/**
 * کارت اعلان — مطابق SVG فیگما.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت ۳۳۲px عرض، radius 28، پس‌زمینه #0D1726
 *     جمع‌شده: ارتفاع ۷۹  |  باز: ارتفاع ۲۸۱
 *   تصویر ۲۶۸×۱۳۴، radius 15
 *
 * در حالت جمع فقط عنوان و خلاصه دیده می‌شود؛ با کلیک روی فلش
 * متن کامل و — اگر داشته باشد — بنر تصویر باز می‌شود.
 *
 * اعلان نخوانده یک نقطه‌ی آبی کنار عنوان دارد (در فیگما نبود چون
 * آن زمان مفهوم خوانده/نخوانده وجود نداشت؛ حالا بک‌اند read_at دارد).
 */
export default function NotificationCard({ item, expanded, onToggle }) {
    return (
        <article
            className={`${styles.card} ${expanded ? styles.expanded : ''} ${
                item.read ? '' : styles.unread
            }`}
        >
            <header className={styles.header}>
                {/* فلش سمت چپ — در RTL انتهای ردیف */}
                <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => onToggle(item.id)}
                    aria-expanded={expanded}
                    aria-label={expanded ? 'بستن اعلان' : 'باز کردن اعلان'}
                >
                    <ChevronDown size={18} className={styles.chevron} />
                </button>

                <div className={styles.titleBlock}>
                    <div className={styles.titleRow}>
                        <h3 className={styles.title}>
                            {!item.read && (
                                <span className={styles.dot} aria-label="نخوانده" />
                            )}
                            {item.title}
                        </h3>
                        <span className={styles.summary}>{item.summary}</span>
                    </div>
                    {!expanded && <p className={styles.collapsedBody}>{item.body}</p>}
                </div>

                <img src={logo} alt="" className={styles.logo} aria-hidden="true" />
            </header>

            {expanded && (
                <div className={styles.body}>
                    <p className={styles.bodyText}>{item.body}</p>
                    {item.image && (
                        <img src={item.image} alt="" className={styles.banner} />
                    )}
                </div>
            )}
        </article>
    )
}
