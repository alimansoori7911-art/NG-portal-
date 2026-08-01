import { ShoppingCart } from 'lucide-react'
import styles from './FloatingBuyButton.module.css'

/**
 * نشانگر تزئینی زیر هدر — مطابق فیگما.
 * عمداً button نیست: کلیک‌پذیر نیست و به جایی نمی‌رود.
 * aria-hidden تا صفحه‌خوان‌ها آن را به‌عنوان دکمه اعلام نکنند.
 *
 * موقعیت از SVG: x=1277 y=120، عرض ۶۷، ارتفاع ۵۶، radius 10
 * (فاصله از راست فریم ۱۴۴۰: 1440 - 1277 - 67 = ۹۶)
 */
export default function FloatingBuyButton() {
    return (
        <div className={styles.badge} aria-hidden="true">
            <ShoppingCart size={22} className={styles.icon} />
            <span className={styles.label}>خرید</span>
        </div>
    )
}