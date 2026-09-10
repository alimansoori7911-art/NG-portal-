import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePlans } from '../../hooks/usePlans'
import styles from './PlanSelectStep.module.css'

/**
 * مرحله‌ی ۱ — انتخاب پلن.
 *
 * پلن‌ها از `GET /products/{slug}/plans` می‌آیند (با همان
 * `usePlans` که صفحه‌ی اصلی استفاده می‌کند).
 *
 * ⚠️ قبلاً یک آرایه‌ی ثابت با شناسه‌های متنی (`'pilot'`, `'base'`…)
 *    اینجا بود. آن شناسه‌ها به `plan_id` می‌رفتند و بک‌اند ۴۲۲
 *    می‌داد: «Input should be a valid integer … input: 'pilot'».
 *    `plan_id` عدد است، پس شناسه باید از خود بک‌اند بیاید.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت      x = 135.5 / 539.5 / 943.5، y=380.5، ۳۶۱×۴۵۸
 *             radius 20.5، border 1px #0047AD، فاصله ۴۳
 *   عنوان     ۳۲px #0047AD | توضیح ۱۸px #ADCFFF
 *   لایسنس    ۱۸px #1474FF، بین دو جداکننده‌ی 1px #264573 (ارتفاع ۶۴)
 *   دکمه      ۲۱۱×۴۹، radius 15.5، border 1px #8CABD9، متن ۲۰px #ADCFFF
 *   فلش       دایره‌ی ۴۰px، مرکز (1356, 609)، fill #0D1726
 */

const PER_PAGE = 3

export default function PlanSelectStep({ onSelect }) {
    const [page, setPage] = useState(0)
    const { plans, loading, error, retry } = usePlans()

    const pageCount = Math.max(1, Math.ceil(plans.length / PER_PAGE))

    /* اگر لیست کوتاه‌تر شد (مثلاً ادمین پلنی را غیرفعال کرد) صفحه‌ی
       فعلی ممکن است دیگر وجود نداشته باشد و کاربر صفحه‌ی خالی ببیند.

       همین‌جا در رندر محدود می‌شود نه با useEffect: افکت یک رندر
       اضافه می‌ساخت و یک لحظه صفحه‌ی خالی نشان می‌داد. */
    const safePage = Math.min(page, pageCount - 1)

    if (loading) {
        return (
            <div className={styles.stage}>
                <div className={styles.glow} aria-hidden="true" />
                <p className={styles.stateMsg}>در حال دریافت پلن‌ها…</p>
            </div>
        )
    }

    /* بدون پلن نمی‌شود سفارش داد، پس مرحله جلو نمی‌رود. دکمه‌ی تلاش
       مجدد لازم است چون خطای شبکه‌ی گذرا کاربر را برای همیشه گیر
       می‌انداخت. */
    if (error || plans.length === 0) {
        return (
            <div className={styles.stage}>
                <div className={styles.glow} aria-hidden="true" />
                <div className={styles.stateBox}>
                    <p className={styles.stateMsg} role="alert">
                        {error || 'پلنی برای فروش موجود نیست'}
                    </p>
                    {error && (
                        <button
                            type="button"
                            className={styles.retryBtn}
                            onClick={retry}
                        >
                            تلاش مجدد
                        </button>
                    )}
                </div>
            </div>
        )
    }

    const visible = plans.slice(
        safePage * PER_PAGE,
        safePage * PER_PAGE + PER_PAGE
    )

    const canPrev = safePage > 0
    const canNext = safePage < pageCount - 1

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
                                {/* `features` از مپر شیء است نه رشته:
                                    { key, label, value } */}
                                {plan.features.map((f) => (
                                    <li key={f.key} className={styles.featureItem}>
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
                    onClick={() => setPage(safePage - 1)}
                    aria-label="پلن‌های قبلی"
                >
                    <ChevronLeft className={styles.navIcon} />
                </button>
            )}

            {canNext && (
                <button
                    type="button"
                    className={`${styles.navBtn} ${styles.navNext}`}
                    onClick={() => setPage(safePage + 1)}
                    aria-label="پلن‌های بعدی"
                >
                    <ChevronRight className={styles.navIcon} />
                </button>
            )}
        </div>
    )
}