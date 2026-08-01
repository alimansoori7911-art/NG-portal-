import { usePlans } from '../../../products/hooks/usePlans'
import styles from './Plans.module.css'

/* زیرعنوان کوتاه مخصوص صفحه‌ی اصلی.
   عمداً از description بک‌اند استفاده نمی‌شود: آنجا متن فروش بلند است
   («مناسب برای سازمان های بزرگ و مراکز داده») ولی اینجا برچسب دسته‌بندی
   کوتاه می‌خواهیم. بک‌اند فقط یک فیلد description دارد و نمی‌تواند هر دو
   را بدهد.

   ⚠️ کلید = PlanOutput.code. اگر بک‌اند کد پلنی را عوض کند، آن کارت
   بی‌سروصدا به متن بلند بک‌اند برمی‌گردد (fallback). */
const SHORT_SUBTITLES = {
    pilot: 'تست و ارزیابی',
    base: 'سازمان‌های کوچک',
    pro: 'سازمان‌های متوسط',
    plus: 'سازمان‌های بزرگ',
    unlimited: 'Enterprise',
}

const subtitleFor = (plan) => SHORT_SUBTITLES[plan.code] ?? plan.subtitle

function PlanCard({ plan, large }) {
    return (
        <div
            className={`${styles.card} ${large ? styles.cardLarge : ''}`}
            style={{ '--hover-color': plan.hoverColor, '--hover-width': plan.hoverWidth }}
        >
            <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{plan.name}</h3>
                <p className={styles.cardSubtitle}>{subtitleFor(plan)}</p>
            </div>

            <div className={styles.divider} />

            <div className={styles.licenseWrapper}>
                <span className={styles.licenseCode}>{plan.licenseCode}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.cardBottom}>
                <button className={styles.ctaBtn}>دریافت پیش فاکتور</button>
            </div>
        </div>
    )
}

function Plans() {
    const { plans, loading, error } = usePlans()

    // موقع لود یا خطا، بخش پلن‌ها در صفحه‌ی اصلی رندر نمی‌شود
    // تا پرش چیدمانی ایجاد نکند. خطا فقط در کنسول لاگ می‌شود.
    if (loading || error || !plans.length) {
        if (error && import.meta.env.DEV) {
            console.warn('[Plans] دریافت پلن‌ها ناموفق بود:', error)
        }
        return null
    }

    /* چیدمان فیگما: پلن pilot بزرگ در ردیف اول، بقیه در ردیف دوم */
    const pilot = plans.find((p) => p.isPilot) ?? plans[0]
    const rest = plans.filter((p) => p.id !== pilot.id)

    return (
        <section className={styles.section}>
            <h2 className={styles.mainTitle}>پلن های فروش</h2>

            {/* ردیف اول — pilot */}
            <div className={styles.pilotRow}>
                <PlanCard plan={pilot} large />
            </div>

            {/* ردیف دوم — بقیه‌ی پلن‌ها */}
            <div className={styles.plansRow}>
                {rest.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} />
                ))}
            </div>
        </section>
    )
}

export default Plans