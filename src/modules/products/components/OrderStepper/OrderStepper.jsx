import styles from './OrderStepper.module.css'

/**
 * نوار مراحل خرید.
 *
 * ارتفاع ثابت ۹۸px و در هر اندازه‌ی صفحه‌ای زیر هدر دیده می‌شود.
 * جهت چیدمان LTR است: «انتخاب پلن» چپ، «تحویل محصول» راست، و خط
 * پیشرفت از چپ پر می‌شود — دقیقاً مطابق فیگما.
 *
 * اعداد از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   نوار      y 96→194 (ارتفاع ۹۸)، خط زیرین ۲px #132239
 *   پیشرفت    ارتفاع ۴، radius 2، #1474FF
 *             عرض به ترتیب: 173 / 449 / 813 / 1118 / 1440
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

/* عرض خط پیشرفت در هر مرحله، به درصد از ۱۴۴۰ */
const PROGRESS = ['12.01%', '31.18%', '56.46%', '77.64%', '100%']

/* تیک ساده — بدون وابستگی به کتابخانه‌ی آیکون */
function CheckMark() {
    return (
        <svg
            className={styles.check}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="8" cy="8" r="8" fill="currentColor" />
            <path
                d="M4.5 8.2L6.9 10.6L11.5 6"
                stroke="#0D1726"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export default function OrderStepper({ currentStep = 0, selectedPlan, onStepClick }) {
    const safeStep = Math.min(Math.max(currentStep, 0), ORDER_STEPS.length - 1)
    const clickable = typeof onStepClick === 'function'

    return (
        <div className={styles.stepper}>
            <div className={styles.list}>
                {ORDER_STEPS.map((step, i) => {
                    const done = i < safeStep
                    const active = i === safeStep

                    const state = done
                        ? styles.done
                        : active
                            ? styles.active
                            : styles.upcoming

                    const content = (
                        <>
                            {i === 0 && selectedPlan ? (
                                <span className={styles.labelStack}>
                                    <span className={styles.label}>{step.label}</span>
                                    <span className={styles.planName}>({selectedPlan})</span>
                                </span>
                            ) : (
                                <span className={styles.label}>{step.label}</span>
                            )}
                            {done && <CheckMark />}
                        </>
                    )

                    return clickable ? (
                        <button
                            key={step.id}
                            type="button"
                            className={`${styles.item} ${state}`}
                            onClick={() => onStepClick(i)}
                        >
                            {content}
                        </button>
                    ) : (
                        <span key={step.id} className={`${styles.item} ${state}`}>
                            {content}
                        </span>
                    )
                })}
            </div>

            <div className={styles.track}>
                <span
                    className={styles.progress}
                    style={{ width: PROGRESS[safeStep] }}
                />
            </div>
        </div>
    )
}