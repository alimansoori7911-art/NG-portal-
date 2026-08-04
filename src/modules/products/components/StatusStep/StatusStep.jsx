import styles from './StatusStep.module.css'

/**
 * مراحل ۳ تا ۵ — صفحات وضعیت سفارش.
 *
 * هر سه ساختار یکسانی دارند و فقط آیکون، عنوان و متن‌ها فرق می‌کنند.
 * بلوک محتوا در کارت عمودی وسط‌چین است (در فیگما فاصله‌ی بالا و پایین
 * در هر سه صفحه دقیقاً برابر است).
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت      x=167 y=237، ۱۰۲۴×۷۴۴، radius 20، #0D1726 با ۳۰٪ شفافیت
 *   آیکون     ارتفاع ۶۴
 *   عنوان     ۵۴px (تحویل محصول ۴۶px)
 *   متن سفید  ۲۴px، line-height ۴۲، #B2C6E5، حداکثر عرض ۶۰۰
 *   متن آبی   ۲۴px، line-height ۴۲، #4792FF، حداکثر عرض ۵۴۰
 *   دکمه‌ها    ۴۲۶×۵۰، radius 11، border 2px #4073BF، فاصله ۲۲
 */
export default function StatusStep({
                                       icon,
                                       title,
                                       description,
                                       hint,
                                       accent = '#7AB0FF',
                                       onViewList,
                                       onClose,
                                   }) {
    return (
        <div className={styles.stage}>
            <div className={styles.card}>
                <div className={styles.content}>
                    <span className={styles.icon} style={{ color: accent }}>
                        {icon}
                    </span>

                    <h2
                        className={styles.title}
                        style={{ color: accent, fontSize: title.length < 15 ? 46 : 54 }}
                    >
                        {title}
                    </h2>

                    <p className={styles.description}>{description}</p>

                    {hint && <p className={styles.hint}>{hint}</p>}

                    <div className={styles.actions}>
                        <button type="button" className={styles.actionBtn} onClick={onViewList}>
                            مشاهده لیست درخواست ها
                        </button>
                        <button type="button" className={styles.actionBtn} onClick={onClose}>
                            بستن صفحه
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}