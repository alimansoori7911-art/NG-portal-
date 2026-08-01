import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePlans } from '../../hooks/usePlans'
import styles from './PlanSelectStep.module.css'

/**
 * مرحله‌ی ۱ — انتخاب پلن.
 *
 * سه کارت در هر صفحه نمایش داده می‌شود؛ با فلش راست بقیه‌ی پلن‌ها
 * می‌آیند و آن‌وقت فلش چپ برای بازگشت ظاهر می‌شود.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت      x = 135.5 / 539.5 / 943.5، y=380.5، ۳۶۱×۴۵۸
 *             radius 20.5، border 1px #0047AD، فاصله ۴۳
 *   جداکننده  1px #264573 — کارت اول در y=525 و y=589 (بخش لایسنس ۶۴)
 *   دکمه      ۲۱۱×۴۹، radius 15.5، border 1px #8CABD9، y=756.5
 *   فلش       دایره‌ی ۴۰px، مرکز (1356, 609)، fill #0D1726
 *   پس‌زمینه   گرادیان شعاعی از (720, -255) شعاع ۷۹۷، #1474FF با ۳۰٪ → ۰ در ۷۰٪
 */

const PER_PAGE = 3

export default function PlanSelectStep({ onSelect }) {
    const { plans, loading, error, retry } = usePlans()
    const [page, setPage] = useState(0)

    const pageCount = Math.max(1, Math.ceil(plans.length / PER_PAGE))
    const visible = plans.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

    const canPrev = page > 0
    const canNext = page < pageCount - 1

    if (loading) {
        return (
            <div className={styles.stage}>
                <div className={styles.grid}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={`${styles.card} ${styles.skeleton}`} aria-hidden="true" />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.stage}>
                <div className={styles.stateBox}>
                    <p className={styles.stateText}>{error}</p>
                    <button type="button" className={styles.selectBtn} onClick={retry}>
                        تلاش دوباره
                    </button>
                </div>
            </div>
        )
    }

    if (!plans.length) {
        return (
            <div className={styles.stage}>
                <div className={styles.stateBox}>
                    <p className={styles.stateText}>در حال حاضر پلنی برای نمایش وجود ندارد.</p>
                </div>
            </div>
        )
    }

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

                        <div className={styles.license}>
                            <span dir="ltr">{plan.licenseCode}</span>
                        </div>

                        <div className={styles.body}>
                            <p className={styles.duration}>{plan.duration}</p>
                            <ul className={styles.featureList}>
                                {plan.features.map((f) => (
                                    <li key={f.key} className={styles.featureItem} dir="ltr">
                                        {f.label}={f.value}
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