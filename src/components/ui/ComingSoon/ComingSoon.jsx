import { Clock } from 'lucide-react'
import styles from './ComingSoon.module.css'

/**
 * پوششِ «به‌زودی» برای بخش‌هایی که هنوز بک‌اند ندارند.
 *
 * محتوای واقعی زیرش رندر می‌شود ولی تار و غیرقابل‌استفاده است، تا
 * کاربر بفهمد این بخش وجود دارد و در راه است — نه اینکه با صفحه‌ی
 * خالی روبه‌رو شود.
 *
 * ⚠️ **مهم:** بلور فقط ظاهر را تار می‌کند؛ متن همچنان در DOM هست و
 * با اسکرین‌شات یا inspect خوانده می‌شود. پس محتوایی که زیر این
 * پوشش می‌گذارید نباید **داده‌ی جعلی** باشد — وگرنه مشتری ممکن است
 * کد لایسنس یا تراکنشِ ساختگی را واقعی بپندارد.
 *
 * قاعده‌ی پروژه: جدول را **خالی** بگذارید و این پوشش را رویش
 * بیندازید. ظاهر همان است، ولی چیزی برای خواندن وجود ندارد.
 *
 * `note` برای وقتی است که دلیلش را هم باید گفت (مثلاً «در فاز
 * توسعه» یا «از طریق سرور لایسنس مدیریت می‌شود»).
 */
export default function ComingSoon({ children, title = 'به‌زودی…', note }) {
    return (
        <div className={styles.wrap}>
            {/* `inert` تعامل و فوکوس کیبورد را می‌گیرد، پس کاربر
                نمی‌تواند با Tab وارد فرمِ غیرفعال شود. */}
            <div className={styles.content} inert="" aria-hidden="true">
                {children}
            </div>

            <div className={styles.overlay}>
                <div className={styles.badge}>
                    <Clock size={18} className={styles.icon} />
                    <span className={styles.title}>{title}</span>
                    {note && <span className={styles.note}>{note}</span>}
                </div>
            </div>
        </div>
    )
}
