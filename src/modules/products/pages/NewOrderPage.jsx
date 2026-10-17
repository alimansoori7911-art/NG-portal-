import { useMemo, useState } from 'react'
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
import { orderService } from '../../../services/orderService'
import { useAuthStore, getIdentifier } from '../../../store/authStore'
import styles from './NewOrderPage.module.css'

/* برچسب فارسی فیلدهای فرم برای ساخت متن یادداشت سفارش */
const NOTE_LABELS = {
    username: 'نام کاربری',
    organization: 'نام سازمان',
    phone: 'شماره تماس',
    email: 'ایمیل',
    organizationId: 'شناسه سازمان',
    mkId: 'MK ID',
    address: 'آدرس',
}

/**
 * تبدیل مقادیر فرم به متن ساخت‌یافته برای customer_note.
 *
 * موقتی است: به‌محض اینکه بک‌اند این فیلدها را در CreateOrder بپذیرد
 * (یا از پروفایل کاربر بخواند) این تابع حذف می‌شود.
 */
function buildOrderNote(values) {
    return Object.entries(NOTE_LABELS)
        .map(([key, label]) => {
            const value = values[key]?.trim()
            return value ? `${label}: ${value}` : null
        })
        .filter(Boolean)
        .join('\n')
}

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

/* پیش‌نویس فرم سفارش — دکمه‌ی «اطلاعات ذخیره شود» در دیالوگ بستن.
   فقط در مرورگر همین کاربر می‌ماند؛ ثبت سفارش یا «بستن صفحه» پاکش
   می‌کند. دسترسی به storage ممکن است خطا بدهد (حالت خصوصی)، پس هر
   خواندن و نوشتن در try است و نبودنش فقط یعنی پیش‌نویسی نیست. */
const DRAFT_KEY = 'ng.orderDraft'

const readDraft = () => {
    try {
        return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
    } catch {
        return null
    }
}

const writeDraft = (values) => {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    } catch {
        /* ذخیره نشد؛ کاربر فقط پیش‌نویس را از دست می‌دهد */
    }
}

const clearDraft = () => {
    try {
        localStorage.removeItem(DRAFT_KEY)
    } catch {
        /* چیزی برای پاک کردن نیست */
    }
}

export default function NewOrderPage() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)

    /* فرم را از پروفایل پر می‌کنیم — کاربری که همین حالا هویتش را
       تأیید کرده نباید نام و ایمیل و شماره‌اش را دوباره تایپ کند.
       `useMemo` لازم است چون شیء تازه در هر رندر، `initialValues` را
       عوض‌شده نشان می‌دهد و فرم را ریست می‌کند. */
    const profileDefaults = useMemo(
        () => ({
            username: getIdentifier(user, 'username'),
            organization: user?.company_name ?? '',
            phone: getIdentifier(user, 'phone'),
            email: getIdentifier(user, 'email'),
            organizationId: user?.company_id ?? '',
            mkId: '',
            address: user?.company_address ?? '',
        }),
        [user]
    )

    const [step, setStep] = useState(0)
    const [selectedPlan, setSelectedPlan] = useState(null)
    /* پیش‌نویس ذخیره‌شده‌ی دفعه‌ی قبل، روی مقادیر پروفایل می‌نشیند */
    const [savedDraft] = useState(readDraft)
    const [orderForm, setOrderForm] = useState(null)
    const [draftValues, setDraftValues] = useState(null)
    const [formDirty, setFormDirty] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const isFirstStep = step === 0

    const leave = () => navigate('/products/buy')

    const saveAndLeave = () => {
        if (draftValues) writeDraft(draftValues)
        leave()
    }

    const discardAndLeave = () => {
        clearDraft()
        leave()
    }

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

    const handleSubmitForm = async (values) => {
        setOrderForm(values)
        setFormDirty(false)
        setSubmitError('')
        setSubmitting(true)

        try {
            /* CreateOrder فقط plan_id/product_id/quantity/customer_note می‌گیرد.
               فیلدهای هویتی فرم (نام، ایمیل، شماره، سازمان) در اسکیما جایی
               ندارند — بک‌اند کاربر را از توکن می‌شناسد. تا اضافه شدن آن‌ها،
               مقادیر فرم به‌صورت متن ساخت‌یافته در customer_note می‌روند تا
               داده‌ای از دست نرود. رجوع به BACKEND_NEEDS.md */
            await orderService.createOrder({
                /* عدد است نه رشته — از `PlanOutput.id` بک‌اند می‌آید.
                   قبلاً شناسه‌ی متنیِ پلن‌های ثابت (`'pilot'`) فرستاده
                   می‌شد و بک‌اند ۴۲۲ می‌داد. */
                plan_id: selectedPlan?.id,
                product_id: selectedPlan?.productId,
                quantity: 1,
                customer_note: buildOrderNote(values),
            })
            clearDraft()
            setStep(2)
        } catch (err) {
            setSubmitError(err?.message || 'ثبت سفارش ناموفق بود')
        } finally {
            setSubmitting(false)
        }
    }

    const renderStep = () => {
        switch (step) {
            case 0:
                return <PlanSelectStep onSelect={handleSelectPlan} />

            case FORM_STEP:
                return (
                    <OrderFormStep
                        planName={selectedPlan?.name}
                        initialValues={
                            orderForm ?? { ...profileDefaults, ...(savedDraft ?? {}) }
                        }
                        onDirtyChange={setFormDirty}
                        onValuesChange={setDraftValues}
                        onBack={() => setStep(0)}
                        onClose={requestClose}
                        onSubmit={handleSubmitForm}
                        submitting={submitting}
                        error={submitError}
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
                onSave={saveAndLeave}
                onDiscard={discardAndLeave}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}