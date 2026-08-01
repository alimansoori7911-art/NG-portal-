import { Check } from 'lucide-react'
import styles from './OrderStepper.module.css'

/**
 * نوار مراحل خرید — مطابق SVG فیگما.
 *
 * جهت چیدمان LTR است: «انتخاب پلن» سمت چپ، «تحویل محصول» سمت راست،
 * و خط پیشرفت از چپ پر می‌شود. (در فیگما هم دقیقاً همین است.)
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   نوار      y 96→194 (ارتفاع ۹۸)
 *   خط زیرین  y=190، ارتفاع ۴، radius 2، #1474FF
 *   چیدمان    space-between با padding افقی ۸۵ — با این عدد، فاصله‌ی
 *             تمام آیتم‌ها دقیقاً ۱۶۲.۱ درمی‌آید که با فیگما یکی است.
 *   برچسب     ۲۰px | تیک ۱۶×۱۶ با فاصله‌ی ۹ از متن
 *   رنگ‌ها     آینده #668FCC | فعال #E0EDFF | تمام‌شده #1474FF
 */

export const ORDER_STEPS = [
    { id: 'plan', label: 'انتخاب پلن' },
    { id: 'form', label: 'ثبت سفارش' },
    { id: 'sales', label: 'تایید از سوی تیم فروش' },
    { id: 'tech', label: 'ارجاع به تیم فنی' },
    { id: 'delivery', label: 'تحویل محصول' },
]

/* عرض خط پیشرفت در هر مرحله — از SVG:
   173 / 449 / 813 / 1118 / 1440 از ۱۴۴۰ */
const PROGRESS = ['12.01%', '31.18%', '56.46%', '77.64%', '100%']

export default function OrderStepper({ currentStep = 0, selectedPlan, onStepClick }) {
    return (
        <nav className={styles.stepper} aria-label="مراحل خرید">
            <ol className={styles.list}>
                {ORDER_STEPS.map((step, i) => {
                    const done = i < currentStep
                    const active = i === currentStep

                    const stateClass = done
                        ? styles.done
                        : active
                            ? styles.active
                            : styles.upcoming

                    const clickable = typeof onStepClick === 'function'

                    return (
                        <li key={step.id} className={`${styles.item} ${stateClass}`}>
                            {clickable ? (
                                <button
                                    type="button"
                                    className={styles.itemInner}
                                    onClick={() => onStepClick(i)}
                                    aria-current={active ? 'step' : undefined}
                                >
                                    <StepLabel step={step} index={i} selectedPlan={selectedPlan} />
                                    {done && <Check size={16} className={styles.check} strokeWidth={3} />}
                                </button>
                            ) : (
                                <span className={styles.itemInner} aria-current={active ? 'step' : undefined}>
                                    <StepLabel step={step} index={i} selectedPlan={selectedPlan} />
                                    {done && <Check size={16} className={styles.check} strokeWidth={3} />}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ol>

            <div className={styles.track}>
                <span
                    className={styles.progress}
                    style={{ width: PROGRESS[currentStep] ?? PROGRESS[0] }}
                />
            </div>
        </nav>
    )
}

/* قدم اول پس از انتخاب پلن، نام پلن را در خط دوم نشان می‌دهد */
function StepLabel({ step, index, selectedPlan }) {
    if (index === 0 && selectedPlan) {
        return (
            <span className={styles.labelStack}>
                <span className={styles.label}>{step.label}</span>
                <span className={styles.planName} dir="ltr">({selectedPlan})</span>
            </span>
        )
    }
    return <span className={styles.label}>{step.label}</span>
}