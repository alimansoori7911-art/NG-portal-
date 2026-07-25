import { useNavigate } from 'react-router-dom'
import styles from './ProductsPlans.module.css'

const PLANS_ROW_1 = [
    {
        id: 'pilot',
        title: 'pilot',
        subtitle: 'مناسب برای ارزیابی اولیه محصول',
        licenseCode: 'NGC-LIC-PILOT-1M',
        duration: 'مدت اعتبار:1ماه',
        features: [
            { label: 'Asset management', value: '5' },
            { label: 'Auditing', value: '2' },
            { label: 'hardening', value: '2' },
        ],
        hoverColor: 'var(--color-primary-soft)',
        hoverWidth: '1px',
    },
    {
        id: 'base',
        title: 'base',
        subtitle: 'مناسب برای کسب و کار های کوچک',
        licenseCode: 'NGC-LIC-base-1Y',
        duration: 'مدت اعتبار:1سال',
        features: [
            { label: 'Asset management', value: '15' },
            { label: 'Auditing', value: '15' },
            { label: 'hardening', value: '15' },
        ],
        hoverColor: 'var(--color-primary-lighter)',
        hoverWidth: '1.25px',
    },
    {
        id: 'pro',
        title: 'pro',
        subtitle: 'مناسب برای سازمان های متوسط و تیم های فناوری اطلاعات',
        licenseCode: 'NGC-LIC-PRO-1Y',
        duration: 'مدت اعتبار:1سال',
        features: [
            { label: 'Asset management', value: '50' },
            { label: 'Auditing', value: '50' },
            { label: 'hardening', value: '50' },
        ],
        hoverColor: 'var(--color-primary-pale)',
        hoverWidth: '1.5px',
    },
]

const PLANS_ROW_2 = [
    {
        id: 'plus',
        title: 'plus',
        subtitle: 'مناسب برای سازمان های بزرگ و مراکز داده',
        licenseCode: 'NGC-LIC-PLUS-1Y',
        duration: 'مدت اعتبار:1سال',
        features: [
            { label: 'Asset management', value: '150' },
            { label: 'Auditing', value: '150' },
            { label: 'hardening', value: '150' },
        ],
        hoverColor: 'var(--color-primary-pale)',
        hoverWidth: '1.5px',
    },
    {
        id: 'unlimited',
        title: 'unlimited',
        subtitle: 'مناسب برای enterprise,MSSP و محیط های چند عملیاتی',
        licenseCode: 'NGC-LIC-unlimited-1Y',
        duration: 'مدت اعتبار:1سال',
        features: [
            { label: 'Asset management', value: 'نامحدود' },
            { label: 'Auditing', value: 'نامحدود' },
            { label: 'hardening', value: 'نامحدود' },
        ],
        hoverColor: 'var(--color-primary-ghost)',
        hoverWidth: '2px',
    },
]

function PlanCard({ plan, onBuy }) {
    return (
        <div
            className={styles.card}
            style={{ '--hover-color': plan.hoverColor, '--hover-width': plan.hoverWidth }}
        >
            <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{plan.title}</h3>
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
                        <li key={f.label} className={styles.featureItem}>
                            <span dir="ltr">{f.label}=</span>{f.value}
                        </li>
                    ))}
                </ul>
                <button className={styles.ctaBtn} onClick={onBuy}>
                    رفتن به ماژول خرید
                </button>
            </div>
        </div>
    )
}

function ProductsPlans() {
    const navigate = useNavigate()
    const goToBuy = () => navigate('/products/buy')

    return (
        <section className={styles.section}>
            <div className={styles.rowThree}>
                {PLANS_ROW_1.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} onBuy={goToBuy} />
                ))}
            </div>
            <div className={styles.rowTwo}>
                {PLANS_ROW_2.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} onBuy={goToBuy} />
                ))}
            </div>
        </section>
    )
}

export default ProductsPlans