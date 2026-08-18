import styles from './PlanCard.module.css'

/**
 * کارت پلن در صفحه‌ی محصولات و کاتالوگ.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۳۸۴):
 *   کارت ۳۲۰×۴۰۰، radius 20، fill #060B13
 *   سه کارت در هر ردیف با گام ۳۶۰ (gap 40)
 *   دکمه‌ها: حذف ۸۲×۴۰ | ویرایش ۹۶×۴۰، radius 10، fill #0D1726
 *
 * ردیف‌های بالای کارت «برچسب = مقدار» هستند (نوع، کاربران هدف، شناسه،
 * مدت اعتبار) و پایین‌ترها قابلیت‌های پلن‌اند که از features می‌آیند.
 */
export default function PlanCard({ plan, termLabel = '', onEdit, onDelete }) {
    return (
        <article className={styles.card}>
            <dl className={styles.meta}>
                <div className={styles.metaRow}>
                    <dt className={styles.metaLabel}>نوع</dt>
                    <dd className={styles.metaValue} dir="ltr">{plan.name}</dd>
                </div>

                {plan.description && (
                    <div className={styles.metaRow}>
                        <dt className={styles.metaLabel}>کاربران هدف</dt>
                        <dd className={styles.metaValue}>{plan.description}</dd>
                    </div>
                )}

                <div className={styles.metaRow}>
                    <dt className={styles.metaLabel}>شناسه</dt>
                    <dd className={styles.metaValue} dir="ltr">
                        {plan.external_plan_code}
                    </dd>
                </div>

                {/* مدت اعتبار از BillingTerm می‌آید، نه از خود پلن */}
                {termLabel && (
                    <div className={styles.metaRow}>
                        <dt className={styles.metaLabel}>مدت اعتبار</dt>
                        <dd className={styles.metaValue}>{termLabel}</dd>
                    </div>
                )}
            </dl>

            {/* قابلیت‌ها — چپ‌چین چون نامشان انگلیسی است */}
            <ul className={styles.features}>
                {(plan.features ?? []).map((f) => (
                    <li key={f.key} className={styles.feature}>
                        <span className={styles.featureName} dir="ltr">{f.label}</span>
                        <span className={styles.featureSep}>=</span>
                        <span className={styles.featureValue}>{f.value}</span>
                    </li>
                ))}
            </ul>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => onEdit?.(plan)}
                >
                    ویرایش
                </button>
                <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => onDelete?.(plan)}
                >
                    حذف
                </button>
            </div>
        </article>
    )
}
