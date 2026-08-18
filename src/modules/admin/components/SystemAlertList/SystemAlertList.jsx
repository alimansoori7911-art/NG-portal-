import { CircleAlert } from 'lucide-react'
import styles from './SystemAlertList.module.css'

/**
 * فهرست اعلان‌های سیستمی — مطابق tab2.svg.
 *
 * اعداد از SVG:
 *   کارت ۷۵۹×۷۶، radius 7.5، پس‌زمینه #060B13
 *   x=214.5، گام عمودی ۱۰۱ (فاصله‌ی ۲۵ بین کارت‌ها)
 *   حاشیه و رنگ متن بر اساس نوع:
 *     info    #7AB0FF  (پیام اخطار)
 *     error   #F44336  (عملیات ناموفق)
 *     warning #FF9800  (پیام هشدار)
 *
 * تاریخ و ساعت در دو خط سمت چپ کارت.
 */
export default function SystemAlertList({ items = [] }) {
    if (items.length === 0) {
        return <p className={styles.empty}>اعلانی برای نمایش وجود ندارد</p>
    }

    return (
        <div className={styles.list}>
            {items.map((item) => (
                <article
                    key={item.id}
                    className={`${styles.card} ${styles[item.type] ?? styles.info}`}
                >
                    {/* در RTL اولین فرزند سمت راست می‌نشیند */}
                    <div className={styles.body}>
                        <div className={styles.titleRow}>
                            <CircleAlert size={16} className={styles.icon} aria-hidden="true" />
                            <h3 className={styles.title}>{item.title}</h3>
                        </div>
                        <p className={styles.message}>{item.message}</p>
                    </div>

                    <div className={styles.meta}>
                        <span>{item.date}</span>
                        <span>{item.time}</span>
                    </div>
                </article>
            ))}
        </div>
    )
}
