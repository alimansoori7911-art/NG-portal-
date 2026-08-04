import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './PlanSelectStep.module.css'

/**
 * مرحله‌ی ۱ — انتخاب پلن.
 *
 * ⚠️ عمداً خودبسنده است و به usePlans / planMapper / productService
 *    وابسته نیست. متن‌ها و اعداد مستقیم از فیگما آمده‌اند تا هیچ لایه‌ی
 *    میانی نتواند آن‌ها را تغییر دهد (مثلاً فارسی‌کردن ارقام).
 *
 * TODO: پس از آماده شدن بک‌اند، PLANS از GET /products/{slug}/plans
 *       پر شود — با حفظ همین قالب متنی.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت      x = 135.5 / 539.5 / 943.5، y=380.5، ۳۶۱×۴۵۸
 *             radius 20.5، border 1px #0047AD، فاصله ۴۳
 *   عنوان     ۳۲px #0047AD | توضیح ۱۸px #ADCFFF
 *   لایسنس    ۱۸px #1474FF، بین دو جداکننده‌ی 1px #264573 (ارتفاع ۶۴)
 *   دکمه      ۲۱۱×۴۹، radius 15.5، border 1px #8CABD9، متن ۲۰px #ADCFFF
 *   فلش       دایره‌ی ۴۰px، مرکز (1356, 609)، fill #0D1726
 */

const PLANS = [
    {
        id: 'pilot',
        name: 'Pilot',
        subtitle: 'مناسب برای ارزیابی اولیه محصول',
        licenseCode: 'NGC-LIC-PILOT-1M',
        duration: 'مدت اعتبار:1ماه',
        features: ['Asset Management=5', 'Auditing=2', 'Hardening=2'],
    },
    {
        id: 'base',
        name: 'Base',
        subtitle: 'مناسب برای کسب و کار های کوچک',
        licenseCode: 'NGC-LIC-base-1Y',
        duration: 'مدت اعتبار:1سال',
        features: ['Asset Management=15', 'Auditing=15', 'Hardening=15'],
    },
    {
        id: 'pro',
        name: 'Pro',
        subtitle: 'مناسب برای سازمان های متوسط و تیم های فناوری اطلاعات',
        licenseCode: 'NGC-LIC-PRO-1Y',
        duration: 'مدت اعتبار:1سال',
        features: ['Asset Management=50', 'Auditing=50', 'Hardening=50'],
    },
    {
        id: 'plus',
        name: 'Plus',
        subtitle: 'مناسب برای سازمان های بزرگ و مراکز داده',
        licenseCode: 'NGC-LIC-PLUS-1Y',
        duration: 'مدت اعتبار:1سال',
        features: ['Asset Management=150', 'Auditing=150', 'Hardening=150'],
    },
    {
        id: 'unlimited',
        name: 'Unlimited',
        subtitle: 'مناسب برای enterprise،MSSP و محیط های چند عملیاتی',
        licenseCode: 'NGC-LIC-unlimited-1Y',
        duration: 'مدت اعتبار:دائمی',
        features: [
            'Asset Management=Unlimited',
            'Auditing=Unlimited',
            'Hardening=Unlimited',
        ],
    },
]

const PER_PAGE = 3

export default function PlanSelectStep({ onSelect }) {
    const [page, setPage] = useState(0)

    const pageCount = Math.ceil(PLANS.length / PER_PAGE)
    const visible = PLANS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

    const canPrev = page > 0
    const canNext = page < pageCount - 1

    return (
        <div className={styles.stage}>
            <div className={styles.glow} aria-hidden="true" />

            <div className={styles.grid}>
                {visible.map((plan) => (
                    <article key={plan.id} className={styles.card}>
                        <div className={styles.head}>
                            <h3 className={styles.name}>{plan.name}</h3>
                            <p className={styles.subtitle}>{plan.subtitle}</p>
                        </div>

                        <div className={styles.license}>{plan.licenseCode}</div>

                        <div className={styles.body}>
                            <p className={styles.duration}>{plan.duration}</p>
                            <ul className={styles.featureList}>
                                {plan.features.map((text) => (
                                    <li key={text} className={styles.featureItem}>
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            type="button"
                            className={styles.selectBtn}
                            onClick={() => onSelect?.(plan)}
                        >
                            انتخاب پلن
                        </button>
                    </article>
                ))}
            </div>

            {canPrev && (
                <button
                    type="button"
                    className={`${styles.navBtn} ${styles.navPrev}`}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label="پلن‌های قبلی"
                >
                    <ChevronLeft className={styles.navIcon} />
                </button>
            )}

            {canNext && (
                <button
                    type="button"
                    className={`${styles.navBtn} ${styles.navNext}`}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="پلن‌های بعدی"
                >
                    <ChevronRight className={styles.navIcon} />
                </button>
            )}
        </div>
    )
}