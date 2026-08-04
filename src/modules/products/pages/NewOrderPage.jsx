import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../../components/layout/Header/Header'
import OrderStepper, { ORDER_STEPS } from '../components/OrderStepper/OrderStepper'
import PlanSelectStep from '../components/PlanSelectStep/PlanSelectStep'
import OrderFormStep from '../components/OrderFormStep/OrderFormStep'
import StatusStep from '../components/StatusStep/StatusStep'
import CloseOrderModal from '../components/CloseOrderModal/CloseOrderModal'
import TagIcon from '../components/icons/TagIcon'
import MonitorIcon from '../components/icons/MonitorIcon'
import CheckIcon from '../components/icons/CheckIcon'
import styles from './NewOrderPage.module.css'

/**
 * جریان ثبت سفارش — پنج مرحله در یک روت با state داخلی.
 *
 * ۰ انتخاب پلن | ۱ ثبت سفارش | ۲ تایید تیم فروش
 * ۳ ارجاع به تیم فنی | ۴ تحویل محصول
 *
 * TODO: مراحل ۲ تا ۴ وضعیت سفارش‌اند و باید از بک‌اند بیایند.
 *       فعلاً برای دیدن UI، در حالت توسعه نوار مراحل کلیک‌پذیر است.
 */

const TRACK_HINT =
    'شما می توانید وضعیت درخواست خود را از بخش لیست درخواست ها پیگیری کنید'

const FORM_STEP = 1

export default function NewOrderPage() {
    const navigate = useNavigate()

    const [step, setStep] = useState(0)
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [orderForm, setOrderForm] = useState(null)
    const [formDirty, setFormDirty] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const isFirstStep = step === 0

    const leave = () => navigate('/products/buy')

    /* در مرحله‌ی فرم و فقط وقتی چیزی وارد شده، اول تأیید گرفته می‌شود.
       در بقیه‌ی مراحل چیزی برای از دست دادن نیست. */
    const requestClose = () => {
        if (step === FORM_STEP && formDirty) {
            setConfirmOpen(true)
            return
        }
        leave()
    }

    const goToOrderList = () => navigate('/products/buy/orders')

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan)
        setStep(FORM_STEP)
    }

    const handleSubmitForm = (values) => {
        setOrderForm(values)
        setFormDirty(false)
        // TODO: ارسال به بک‌اند؛ فعلاً مستقیم به مرحله‌ی وضعیت می‌رود
        setStep(2)
    }

    const renderStep = () => {
        switch (step) {
            case 0:
                return <PlanSelectStep onSelect={handleSelectPlan} />

            case FORM_STEP:
                return (
                    <OrderFormStep
                        planName={selectedPlan?.name}
                        initialValues={orderForm}
                        onDirtyChange={setFormDirty}
                        onBack={() => setStep(0)}
                        onClose={requestClose}
                        onSubmit={handleSubmitForm}
                    />
                )

            case 2:
                return (
                    <StatusStep
                        icon={<TagIcon />}
                        title="تایید از سوی تیم فروش"
                        description="تیم فروش در حال برسی سفارش ثبت شده است ،و به زودی با شما تماس خواهند گرفت ،پس از تایید از سوی تیم فروش درخواست شما به تیم فنی ارجاع داده خواهد شد"
                        hint={TRACK_HINT}
                        onViewList={goToOrderList}
                        onClose={requestClose}
                    />
                )

            case 3:
                return (
                    <StatusStep
                        icon={<MonitorIcon />}
                        title="ارجاع به تیم فنی"
                        description="تیم فنی در حال توسعه و پیاده سازی درخواست شما هستند و پس پیاده سازی ،محصول تحویل شما داده خواهد شد"
                        hint={TRACK_HINT}
                        onViewList={goToOrderList}
                        onClose={requestClose}
                    />
                )

            case 4:
                return (
                    <StatusStep
                        icon={<CheckIcon />}
                        title="تحویل محصول"
                        description="محصول شما تحویل داده شد و اماده استفاده است"
                        accent="#1474FF"
                        onViewList={goToOrderList}
                        onClose={requestClose}
                    />
                )

            default:
                return (
                    <div className={styles.placeholder}>
                        {ORDER_STEPS[step]?.label}
                    </div>
                )
        }
    }

    return (
        <div className={styles.page}>
            <Header />

            <OrderStepper
                currentStep={step}
                selectedPlan={selectedPlan?.name}
                /* فقط در توسعه: امکان جابه‌جایی بین مراحل برای بررسی UI */
                onStepClick={import.meta.env.DEV ? setStep : undefined}
            />

            <main className={styles.main}>
                <div className={styles.topActionRow}>
                    <button
                        type="button"
                        className={`${styles.topAction} ${isFirstStep ? styles.topActionNarrow : ''}`}
                        onClick={requestClose}
                    >
                        {isFirstStep ? 'برگشت' : 'بستن صفحه'}
                    </button>
                </div>

                {renderStep()}
            </main>

            <CloseOrderModal
                open={confirmOpen}
                /* TODO: ذخیره‌ی واقعی پس از آماده شدن بک‌اند */
                onSave={leave}
                onDiscard={leave}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}