import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../../components/layout/Header/Header'
import FitScreen from '../../../components/layout/FitScreen/FitScreen'
import OrderStepper, { ORDER_STEPS } from '../components/OrderStepper/OrderStepper'
import PlanSelectStep from '../components/PlanSelectStep/PlanSelectStep'
import styles from './NewOrderPage.module.css'

/**
 * جریان ثبت سفارش — پنج مرحله در یک روت با state داخلی.
 *
 * ۰ انتخاب پلن | ۱ ثبت سفارش | ۲ تایید تیم فروش
 * ۳ ارجاع به تیم فنی | ۴ تحویل محصول
 *
 * تمام اعداد CSS این صفحه خام و مستقیم از فیگما هستند؛ مقیاس‌دهی به
 * اندازه‌ی نمایشگر را FitScreen انجام می‌دهد.
 *
 * TODO: مراحل ۲ تا ۴ وضعیت سفارش‌اند و باید از بک‌اند بیایند.
 *       فعلاً برای دیدن UI، در حالت توسعه نوار مراحل کلیک‌پذیر است.
 */
export default function NewOrderPage() {
    const navigate = useNavigate()

    const [step, setStep] = useState(0)
    const [selectedPlan, setSelectedPlan] = useState(null)

    // TODO: ذخیره‌ی اطلاعات فرم پس از آماده شدن بک‌اند
    const [orderForm, setOrderForm] = useState(null)

    const isFirstStep = step === 0

    const handleTopAction = () => {
        if (isFirstStep) {
            navigate('/products/buy')
            return
        }
        // TODO: مودال «ذخیره‌ی اطلاعات» اینجا باز می‌شود
        navigate('/products/buy')
    }

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan)
        setStep(1)
    }

    const renderStep = () => {
        switch (step) {
            case 0:
                return <PlanSelectStep onSelect={handleSelectPlan} />
            default:
                // TODO: کامپوننت مراحل بعدی در قدم‌های بعدی اضافه می‌شود
                return (
                    <div className={styles.placeholder}>
                        مرحله‌ی {step + 1}: {ORDER_STEPS[step].label}
                    </div>
                )
        }
    }

    return (
        <FitScreen>
            <Header />

            <OrderStepper
                currentStep={step}
                selectedPlan={selectedPlan?.name}
                /* فقط در توسعه: امکان جابه‌جایی بین مراحل برای بررسی UI */
                onStepClick={import.meta.env.DEV ? setStep : undefined}
            />

            <div className={styles.topActionRow}>
                <button
                    type="button"
                    className={`${styles.topAction} ${isFirstStep ? styles.topActionNarrow : ''}`}
                    onClick={handleTopAction}
                >
                    {isFirstStep ? 'برگشت' : 'بستن صفحه'}
                </button>
            </div>

            <main className={styles.main}>{renderStep()}</main>
        </FitScreen>
    )
}