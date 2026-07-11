import styles from './Plans.module.css'

const PILOT_PLAN = {
    id: 'pilot',
    title: 'pilot',
    subtitle: 'تست و ارزیابی',
    licenseCode: 'NGC-LIC-BASE-1Y',
    hoverColor: 'var(--color-primary-light)',
    hoverWidth: '1px',
}

const PLANS = [
    { id: 'unlimited', title: 'unlimited', subtitle: 'Enterprise', licenseCode: 'NGC-LIC-ULT-1Y', hoverColor: 'var(--color-primary-ghost)', hoverWidth: '2px' },
    { id: 'plus', title: 'Plus', subtitle: 'سازمان‌های بزرگ', licenseCode: 'NGC-LIC-PROP-1Y', hoverColor: 'var(--color-primary-pale)', hoverWidth: '1.5px' },
    { id: 'pro', title: 'Pro', subtitle: 'سازمان‌های متوسط', licenseCode: 'NGC-LIC-PRO-1Y', hoverColor: 'var(--color-primary-lighter)', hoverWidth: '1.25px' },
    { id: 'base', title: 'Base', subtitle: 'سازمان‌های کوچک', licenseCode: 'NGC-LIC-BASE-1Y', hoverColor: 'var(--color-primary-soft)', hoverWidth: '1px' },
]

function PlanCard({ plan, large }) {
    return (
        <div
            className={`${styles.card} ${large ? styles.cardLarge : ''}`}
            style={{ '--hover-color': plan.hoverColor, '--hover-width': plan.hoverWidth }}
        >
            <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{plan.title}</h3>
                <p className={styles.cardSubtitle}>{plan.subtitle}</p>
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
    return (
        <section className={styles.section}>
            <h2 className={styles.mainTitle}>پلن های فروش</h2>

            {/* ردیف اول — pilot */}
            <div className={styles.pilotRow}>
                <PlanCard plan={PILOT_PLAN} large />
            </div>

            {/* ردیف دوم — ۴ پلن */}
            <div className={styles.plansRow}>
                {PLANS.map(plan => (
                    <PlanCard key={plan.id} plan={plan} />
                ))}
            </div>
        </section>
    )
}

export default Plans