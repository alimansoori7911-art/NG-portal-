import styles from './AuditLogList.module.css'

/**
 * لاگ ممیزی — چیدمان دو ستونه مطابق SVG.
 *
 * هر آیتم از راست به چپ:
 *   کارت IP/زمان (۱۲۰×۸۲) → برچسب‌ها (نوع عملیات، ادمین مربوطه) → مقادیر
 * و یک خط عمودی #264573 در لبه‌ی راست هر آیتم.
 *
 * ترتیب پر شدن در فیگما ستونی نیست بلکه ردیفی است: هر ردیف دو آیتم دارد
 * (یکی راست، یکی چپ) — با grid دو ستونه همین رفتار به‌دست می‌آید.
 */
export default function AuditLogList({ items = [] }) {
    if (items.length === 0) {
        return <p className={styles.empty}>موردی برای نمایش وجود ندارد</p>
    }

    return (
        <div className={styles.grid}>
            {items.map((item) => (
                <article key={item.id} className={styles.item}>
                    <div className={styles.card}>
                        <span className={styles.cardLine} dir="ltr">
                            IP={item.ip}
                        </span>
                        <span className={styles.cardLine} dir="ltr">
                            Time={item.time}
                        </span>
                    </div>

                    <div className={styles.labels}>
                        <span className={styles.label}>نوع عملیات</span>
                        <span className={styles.label}>ادمین مربوطه</span>
                    </div>

                    <div className={styles.values}>
                        <span className={styles.value}>{item.action}</span>
                        <span className={styles.value} dir="ltr">
                            {item.admin}
                        </span>
                    </div>
                </article>
            ))}
        </div>
    )
}
