import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'

import Header from '../../../components/layout/Header/Header'
import Input from '../../../components/ui/Input/Input'
import Select from '../../../components/ui/Select/Select'
import Textarea from '../../../components/ui/Textarea/Textarea'
import Button from '../../../components/ui/Button/Button'
import Alert from '../../../components/ui/Alert/Alert'
import BankAccountBox from '../components/BankAccountBox/BankAccountBox'
import PaymentList from '../components/PaymentList/PaymentList'
import OrderInvoices from '../components/OrderInvoices/OrderInvoices'
import { useOrderPayment, toPaymentPayload } from '../hooks/useOrderPayment'
import { usePaymentUpload } from '../hooks/usePaymentUpload'
import { ACCEPT_ATTR } from '../../../services/fileService'
import { formatToman, rialToToman } from '../../../utils/currency'
import { PAYMENT_METHODS, statusLabel } from '../../../services/orderService'
import styles from './OrderPaymentPage.module.css'

/**
 * پیش‌فاکتور و ثبت رسید پرداخت.
 *
 * یک صفحه با دو حالت است، نه دو صفحه — چون `flow.dot` می‌گوید
 * «payment = acceptance»: پرداخت کردن خودش یعنی قبول پیش‌فاکتور،
 * پس دکمه‌ی جداگانه‌ی «تأیید می‌کنم» یک کلیک اضافه‌ی بی‌فایده بود.
 *
 * پرداخت آنلاین وجود ندارد (تأییدشده از هر دو فایل فلو و از اسپک).
 * کاربر بیرون از سایت واریز می‌کند و اینجا فقط رسیدش را ثبت می‌کند.
 *
 * هندسه از OrderFormStep گرفته شده تا با بقیه‌ی مراحل خرید یکدست باشد.
 */

/* نام فارسی روش‌ها برای Select که فقط رشته می‌گیرد */
const METHOD_LABELS = Object.values(PAYMENT_METHODS)
const methodCodeOf = (label) =>
    Object.keys(PAYMENT_METHODS).find((k) => PAYMENT_METHODS[k] === label)

const schema = z.object({
    amount: z
        .string()
        .min(1, 'مبلغ الزامی است')
        .refine((v) => Number(v.replace(/,/g, '')) > 0, 'مبلغ باید بیشتر از صفر باشد'),
    method: z.string().min(1, 'روش پرداخت را انتخاب کنید'),
    /* اسپک این را اختیاری گذاشته ولی در UI اجباری است: بدون شماره‌ی
       پیگیری، ادمین نمی‌تواند واریز را در صورت‌حساب بانک پیدا کند. */
    trackingNumber: z.string().min(1, 'شماره پیگیری الزامی است'),
    payerName: z.string().optional(),
    paidAt: z.string().optional(),
    receiptRef: z.string().optional(),
    note: z.string().optional(),
})

export default function OrderPaymentPage() {
    const navigate = useNavigate()
    const { id: orderId } = useParams()

    const {
        order,
        payments,
        loading,
        error,
        submitting,
        submitError,
        submitPayment,
        reload,
        payableRial,
        remainingRial,
        isFullyPaid,
    } = useOrderPayment(orderId)

    /* حالت صفحه: نمایش پیش‌فاکتور یا فرم ثبت رسید */
    const [mode, setMode] = useState('proforma')
    const [done, setDone] = useState(false)

    /* پیوست رسید — اختیاری است، ولی اگر انتخاب شود مسیر ثبت عوض
       می‌شود: یک اندپوینت جدا هم رکورد را می‌سازد هم توکن آپلود
       می‌دهد. جزئیاتش در usePaymentUpload. */
    const [file, setFile] = useState(null)
    const upload = usePaymentUpload(orderId)

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            amount: '',
            method: PAYMENT_METHODS.bank_transfer,
            trackingNumber: '',
            payerName: '',
            paidAt: '',
            receiptRef: '',
            note: '',
        },
    })

    const onSubmit = async (data) => {
        const form = {
            ...data,
            method: methodCodeOf(data.method) ?? 'bank_transfer',
        }

        /* دو مسیر متفاوت — نباید هر دو صدا زده شوند وگرنه دو رسید
           تکراری ثبت می‌شود. */
        const ok = file
            ? await upload.submitWithFile(toPaymentPayload(form), file)
            : await submitPayment(form)

        if (ok) {
            /* کاربر همان‌جا می‌ماند تا باقی‌مانده را ببیند و در صورت
               نیاز رسید بعدی را ثبت کند (تصمیم چند-رسید). */
            reset()
            setFile(null)
            upload.reset()
            setDone(true)
            setMode('proforma')
            await reload()
        }
    }

    if (loading) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}>
                    <p className={styles.state}>در حال دریافت سفارش…</p>
                </main>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}>
                    <p className={styles.state} role="alert">
                        {error || 'سفارش پیدا نشد'}
                    </p>
                </main>
            </div>
        )
    }

    const planName = order.snapshot_plan_name || order.snapshot_product_name || ''

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.card}>
                    {planName && <span className={styles.planBadge}>{planName}</span>}

                    <button
                        type="button"
                        className={styles.close}
                        onClick={() => navigate('/products/buy/orders')}
                        aria-label="بازگشت به لیست سفارش‌ها"
                    >
                        <X size={18} strokeWidth={3} />
                    </button>

                    {mode === 'proforma' ? (
                        <>
                            <h1 className={styles.title}>پیش‌فاکتور</h1>
                            <p className={styles.subtitle}>
                                شماره: <span dir="ltr">{order.order_number}</span>
                                {' · '}
                                {statusLabel(order.status)}
                            </p>

                            <div className={styles.scroll}>
                                {done && (
                                    <Alert variant="success" onClose={() => setDone(false)}>
                                        رسید ثبت شد و پس از بررسی ادمین تأیید می‌شود.
                                    </Alert>
                                )}

                                {/* ─── جدول مبلغ ─── */}
                                <section className={styles.summaryBox}>
                                    <Row label="محصول" value={order.snapshot_product_name} />
                                    <Row label="پلن" value={order.snapshot_plan_name} />
                                    <Row
                                        label="مدت"
                                        value={order.snapshot_plan_base_price_name}
                                    />
                                    <Row
                                        label="تعداد"
                                        value={order.requested_quantity?.toLocaleString('fa-IR')}
                                    />

                                    <div className={styles.divider} />

                                    <Row
                                        label="مبلغ پایه"
                                        value={formatToman(order.quoted_amount)}
                                    />
                                    {Number(order.discount_amount) > 0 && (
                                        <Row
                                            label="تخفیف"
                                            value={`− ${formatToman(order.discount_amount)}`}
                                        />
                                    )}
                                    {Number(order.tax_amount) > 0 && (
                                        <Row
                                            label="مالیات"
                                            value={formatToman(order.tax_amount)}
                                        />
                                    )}

                                    <div className={styles.dividerStrong} />

                                    <div className={styles.totalRow}>
                                        <span>قابل پرداخت</span>
                                        <span className={styles.totalValue}>
                                            {formatToman(payableRial)}
                                        </span>
                                    </div>
                                </section>

                                <PaymentList
                                    payments={payments}
                                    payableRial={payableRial}
                                    remainingRial={remainingRial}
                                />

                                {/* فاکتور فقط بعد از تأیید پرداخت صادر
                                    می‌شود، پس اگر نبود چیزی رندر نمی‌شود. */}
                                <OrderInvoices orderId={order?.id} />

                                {!isFullyPaid && <BankAccountBox />}

                                <p className={styles.hint}>
                                    {isFullyPaid
                                        ? 'مبلغ این سفارش به‌طور کامل پرداخت و تأیید شده است.'
                                        : 'پس از واریز، رسید را ثبت کنید تا توسط پشتیبانی بررسی شود.'}
                                </p>
                            </div>

                            <div className={styles.actions}>
                                <Button
                                    type="button"
                                    onClick={() => setMode('form')}
                                    disabled={isFullyPaid}
                                >
                                    پرداخت کردم، ثبت رسید
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/products/buy/orders')}
                                >
                                    بازگشت به لیست
                                </Button>
                            </div>
                        </>
                    ) : (
                        <form
                            className={styles.formWrap}
                            onSubmit={handleSubmit(onSubmit)}
                            noValidate
                        >
                            <h1 className={styles.title}>ثبت رسید پرداخت</h1>
                            <p className={styles.subtitle}>
                                باقی‌مانده: {formatToman(remainingRial)}
                            </p>

                            <div className={styles.scroll}>
                                <Alert onClose={() => {}}>{submitError}</Alert>

                                <div className={styles.grid}>
                                    <Input
                                        label="مبلغ واریزی (تومان)"
                                        inputMode="numeric"
                                        error={errors.amount?.message}
                                        {...register('amount')}
                                    />

                                    <Controller
                                        name="method"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                label="روش پرداخت"
                                                options={METHOD_LABELS}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />

                                    <Input
                                        label="نام واریزکننده"
                                        persian
                                        error={errors.payerName?.message}
                                        {...register('payerName')}
                                    />
                                    <Input
                                        label="شماره پیگیری"
                                        inputMode="numeric"
                                        error={errors.trackingNumber?.message}
                                        {...register('trackingNumber')}
                                    />

                                    {/* type=date تقویم میلادی مرورگر را باز
                                        می‌کند (mm/dd/yyyy) که برای کاربر
                                        ایرانی گیج‌کننده است. متن ساده با
                                        الگوی شمسی گرفته می‌شود و در
                                        onSubmit به ISO تبدیل می‌شود. */}
                                    <Input
                                        label="تاریخ واریز (۱۴۰۵/۰۵/۲۰)"
                                        inputMode="numeric"
                                        error={errors.paidAt?.message}
                                        {...register('paidAt')}
                                    />
                                    <Input
                                        label="شماره رسید"
                                        error={errors.receiptRef?.message}
                                        {...register('receiptRef')}
                                    />

                                    <div className={styles.fullWidth}>
                                        <Textarea
                                            label="توضیحات"
                                            error={errors.note?.message}
                                            {...register('note')}
                                        />
                                    </div>

                                    {/* پیوست تصویر رسید — اختیاری.
                                        اگر انتخاب شود، ثبت از مسیر
                                        attachments می‌رود که هم رکورد
                                        می‌سازد هم توکن آپلود می‌دهد. */}
                                    <div className={styles.fullWidth}>
                                        <label className={styles.fileLabel}>
                                            <span className={styles.fileLabelText}>
                                                تصویر رسید (اختیاری) — JPG، PNG یا PDF،
                                                حداکثر ۵ مگابایت
                                            </span>
                                            <input
                                                type="file"
                                                accept={ACCEPT_ATTR}
                                                className={styles.fileInput}
                                                disabled={upload.uploading}
                                                onChange={(e) => {
                                                    setFile(e.target.files?.[0] ?? null)
                                                    upload.reset()
                                                }}
                                            />
                                        </label>

                                        {file && (
                                            <p className={styles.fileName}>
                                                <span dir="ltr">{file.name}</span>
                                                {' · '}
                                                {(file.size / 1024).toLocaleString('fa-IR', {
                                                    maximumFractionDigits: 0,
                                                })}{' '}
                                                کیلوبایت
                                            </p>
                                        )}

                                        {upload.uploading && upload.progress > 0 && (
                                            <p className={styles.fileName}>
                                                در حال بارگذاری… {upload.progress}٪
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* رسید ثبت شده ولی فایل نرفته — کاربر نباید
                                فرم را دوباره بفرستد چون رسید تکراری می‌شود. */}
                            {upload.partial && (
                                <p className={styles.partialWarn} role="alert">
                                    رسید شما ثبت شد ولی بارگذاری فایل انجام نشد.
                                    فرم را دوباره نفرستید — برای پیوست تصویر با
                                    پشتیبانی تماس بگیرید.
                                </p>
                            )}

                            {upload.error && !upload.partial && (
                                <p className={styles.partialWarn} role="alert">
                                    {upload.error}
                                </p>
                            )}

                            <div className={styles.actions}>
                                <Button
                                    type="submit"
                                    disabled={!isValid}
                                    loading={submitting || upload.uploading}
                                >
                                    ثبت رسید
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setMode('proforma')}
                                >
                                    بازگشت
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    )
}

/* ردیف دوستونه‌ی جدول مبلغ — مقدار تهی رندر نمی‌شود */
function Row({ label, value }) {
    if (!value) return null
    return (
        <div className={styles.row}>
            <span className={styles.rowLabel}>{label}</span>
            <span className={styles.rowValue}>{value}</span>
        </div>
    )
}
