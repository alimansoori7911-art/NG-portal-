import {
    ChevronDown,
    Bell,
    BadgeCheck,
    LifeBuoy,
    ShoppingCart,
    ShieldAlert,
    Receipt,
} from 'lucide-react'
import styles from './NotificationCard.module.css'

/* آیکون بر اساس نوع اعلان — enum `NotificationType` بک‌اند.

   قبلاً اینجا `logo-color.png` بود که فایلش خالی است (۵۰۸ بایت) و
   فقط یک مربع تهی نشان می‌داد. آیکون هم دیده می‌شود هم می‌گوید اعلان
   درباره‌ی چیست. */
const TYPE_ICONS = {
    system: Bell,
    kyc: BadgeCheck,
    ticket: LifeBuoy,
    order: ShoppingCart,
    security: ShieldAlert,
    /* در enum اسپک نیست ولی بک‌اند می‌فرستد */
    invoice: Receipt,
}

const TYPE_LABELS = {
    system: 'سیستمی',
    kyc: 'احراز هویت',
    ticket: 'تیکت',
    order: 'سفارش',
    security: 'امنیتی',
    invoice: 'فاکتور',
}

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
    /* نوع ناشناخته هم آیکون می‌گیرد تا جای خالی نماند */
    const Icon = TYPE_ICONS[item.type] ?? Bell
    const typeLabel = TYPE_LABELS[item.type] ?? 'اعلان'

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

                <span
                    className={`${styles.typeIcon} ${styles[item.type] ?? ''}`}
                    title={typeLabel}
                >
                    <Icon size={16} strokeWidth={2} aria-hidden="true" />
                    <span className={styles.srOnly}>{typeLabel}</span>
                </span>
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
