import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import Header from '../../../components/layout/Header/Header'
import Input from '../../../components/ui/Input/Input'
import Select from '../../../components/ui/Select/Select'
import Textarea from '../../../components/ui/Textarea/Textarea'
import Button from '../../../components/ui/Button/Button'
import Alert from '../../../components/ui/Alert/Alert'
import { useAuthStore, getIdentifier } from '../../../store/authStore'
import { useDepartments } from '../hooks/useDepartments'
import { ticketService } from '../../../services/ticketService'
import styles from './NewTicketPage.module.css'

const schema = z.object({
    username: z.string().min(1, 'نام کاربری الزامی است'),
    organization: z.string().optional(),
    phone: z
        .string()
        .min(1, 'شماره تماس الزامی است')
        .regex(/^09\d{9}$/, 'شماره تماس معتبر نیست'),
    email: z.string().min(1, 'ایمیل الزامی است').email('ایمیل معتبر نیست'),
    department: z.string().min(1, 'انتخاب دپارتمان الزامی است'),
    description: z.string().min(10, 'توضیحات حداقل ۱۰ کاراکتر باشد'),
})

/* موضوع تیکت از خط اول توضیحات ساخته می‌شود چون فرم فیگما فیلد
   جداگانه‌ای برای موضوع ندارد ولی بک‌اند subject را اجباری کرده
   (بین ۳ تا ۲۵۵ کاراکتر). */
const SUBJECT_MAX = 255

function makeSubject(description) {
    const firstLine = description.trim().split('\n')[0].trim()
    return firstLine.length > SUBJECT_MAX
        ? `${firstLine.slice(0, SUBJECT_MAX - 1)}…`
        : firstLine
}

function NewTicketPage() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)

    const {
        names: departmentNames,
        idOf,
        loading: departmentsLoading,
        error: departmentsError,
    } = useDepartments()

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
            username: '',
            organization: '',
            phone: '',
            email: '',
            department: '',
            description: '',
        },
    })

    // پیش‌پر کردن فیلدها از پروفایل کاربر پس از لود شدن
    useEffect(() => {
        if (!user) return
        reset((prev) => ({
            ...prev,
            username: getIdentifier(user, 'username'),
            phone: getIdentifier(user, 'phone'),
            email: getIdentifier(user, 'email'),
        }))
    }, [user, reset])

    /* بک‌اند تیکت را در دو مرحله می‌سازد: اول خود تیکت (فقط دپارتمان
       و موضوع) و بعد متن توضیحات به‌عنوان اولین پیام.
       اگر مرحله‌ی دوم شکست بخورد تیکت ساخته شده ولی بدون متن است،
       پس کاربر را به صفحه‌ی چت همان تیکت می‌فرستیم تا خودش بفرستد. */
    const onSubmit = async (data) => {
        const departmentId = idOf(data.department)
        if (!departmentId) {
            setSubmitError('دپارتمان انتخاب‌شده معتبر نیست')
            return
        }

        setSubmitting(true)
        setSubmitError(null)

        let ticket
        try {
            ticket = await ticketService.createTicket({
                department_id: departmentId,
                subject: makeSubject(data.description),
            })
        } catch (err) {
            setSubmitError(err?.message || 'ثبت تیکت ناموفق بود')
            setSubmitting(false)
            return
        }

        try {
            await ticketService.reply(ticket.id, data.description)
            navigate('/helpdesk/tickets')
        } catch {
            navigate(`/helpdesk/tickets/${ticket.id}/chat`)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <Header />

            <main className={styles.page}>
                <form className={styles.card} onSubmit={handleSubmit(onSubmit)} noValidate>
                    <h1 className={styles.title}>ثبت تیکیت</h1>

                    <div className={styles.grid}>
                        <Input
                            label="نام کاربری"
                            error={errors.username?.message}
                            {...register('username')}
                        />
                        <Input
                            label="نام سازمان"
                            persian
                            error={errors.organization?.message}
                            {...register('organization')}
                        />
                        <Input
                            label="شماره تماس"
                            inputMode="numeric"
                            error={errors.phone?.message}
                            {...register('phone')}
                        />
                        <Input
                            label="ایمیل"
                            type="email"
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Controller
                            name="department"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    label="دپارتمان"
                                    options={departmentNames}
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={departmentsLoading}
                                />
                            )}
                        />
                        {/* ستون خالی کنار دپارتمان — مطابق فیگما */}
                        <span aria-hidden="true" />

                        <div className={styles.fullWidth}>
                            <Textarea
                                label="توضیحات"
                                error={errors.description?.message}
                                {...register('description')}
                            />
                        </div>
                    </div>

                    <Alert onClose={() => setSubmitError(null)}>
                        {submitError || departmentsError}
                    </Alert>

                    <div className={styles.actions}>
                        <Button
                            type="submit"
                            disabled={!isValid || departmentsLoading}
                            loading={submitting}
                        >
                            ثبت درخواست
                        </Button>
                        {/* TODO: مسیر لیست تیکت‌ها بعداً مشخص می‌شود */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/helpdesk/tickets')}
                        >
                            مشاهده تیکت ها
                        </Button>
                    </div>
                </form>
            </main>
        </>
    )
}

export default NewTicketPage