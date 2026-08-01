import { useNavigate } from 'react-router-dom'
import { usePlans } from '../../hooks/usePlans'
import styles from './ProductsPlans.module.css'

function PlanCard({ plan, onBuy }) {
    return (
        <div
            className={styles.card}
            style={{ '--hover-color': plan.hoverColor, '--hover-width': plan.hoverWidth }}
        >
            <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{plan.name}</h3>
                <p className={styles.cardSubtitle}>{plan.subtitle}</p>
            </div>

            <div className={styles.divider} />

            <div className={styles.licenseWrapper}>
                <span className={styles.licenseCode} dir="ltr">{plan.licenseCode}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.cardBody}>
                <p className={styles.duration}>{plan.duration}</p>
                <ul className={styles.featureList}>
                    {plan.features.map((f) => (
                        <li key={f.key} className={styles.featureItem}>
                            <span dir="ltr">{f.label}=</span>{f.value}
                        </li>
                    ))}
                </ul>
                <button className={styles.ctaBtn} onClick={() => onBuy(plan)}>
                    رفتن به ماژول خرید
                </button>
            </div>
        </div>
    )
}

/* اسکلتون با همان ابعاد کارت واقعی تا موقع لود پرش نداشته باشیم */
function SkeletonCard() {
    return (
        <div className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
            <div className={styles.cardTop}>
                <span className={`${styles.shimmer} ${styles.shimmerTitle}`} />
                <span className={`${styles.shimmer} ${styles.shimmerLine}`} />
            </div>
            <div className={styles.divider} />
            <div className={styles.licenseWrapper}>
                <span className={`${styles.shimmer} ${styles.shimmerLine}`} />
            </div>
            <div className={styles.divider} />
            <div className={styles.cardBody}>
                <span className={`${styles.shimmer} ${styles.shimmerShort}`} />
                <span className={`${styles.shimmer} ${styles.shimmerLine}`} />
                <span className={`${styles.shimmer} ${styles.shimmerLine}`} />
                <span className={`${styles.shimmer} ${styles.shimmerLine}`} />
                <span className={`${styles.shimmer} ${styles.shimmerBtn}`} />
            </div>
        </div>
    )
}

function ProductsPlans() {
    const navigate = useNavigate()
    const { plans, loading, error, retry } = usePlans()

    // TODO: پس از ساخت صفحه‌ی خرید، کد پلن انتخاب‌شده هم منتقل شود
    const goToBuy = () => navigate('/products/buy')

    if (loading) {
        return (
            <section className={styles.section}>
                <div className={styles.rowThree}>
                    {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
                </div>
                <div className={styles.rowTwo}>
                    {[3, 4].map((i) => <SkeletonCard key={i} />)}
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className={styles.section}>
                <div className={styles.stateBox}>
                    <p className={styles.stateText}>{error}</p>
                    <button type="button" className={styles.ctaBtn} onClick={retry}>
                        تلاش دوباره
                    </button>
                </div>
            </section>
        )
    }

    if (!plans.length) {
        return (
            <section className={styles.section}>
                <div className={styles.stateBox}>
                    <p className={styles.stateText}>در حال حاضر پلنی برای نمایش وجود ندارد.</p>
                </div>
            </section>
        )
    }

    /* چیدمان فیگما: سه کارت در ردیف اول، بقیه در ردیف دوم */
    const rowOne = plans.slice(0, 3)
    const rowTwo = plans.slice(3)

    return (
        <section className={styles.section}>
            <div className={styles.rowThree}>
                {rowOne.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} onBuy={goToBuy} />
                ))}
            </div>
            {rowTwo.length > 0 && (
                <div className={styles.rowTwo}>
                    {rowTwo.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} onBuy={goToBuy} />
                    ))}
                </div>
            )}
        </section>
    )
}

export default ProductsPlans