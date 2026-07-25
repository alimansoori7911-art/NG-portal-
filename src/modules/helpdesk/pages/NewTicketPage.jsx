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
import { useAuthStore } from '../../../store/authStore'
import styles from './NewTicketPage.module.css'

// TODO: بعداً از بک‌اند خوانده می‌شود
const DEPARTMENTS = ['پشتیبانی فنی', 'فروش', 'مالی و حسابداری', 'امور مشتریان']

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

// استخراج مقدار از آرایه‌ی identifiers کاربر
const identifier = (user, type) =>
    user?.identifiers?.find((i) => i.type === type)?.value ?? ''

function NewTicketPage() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const [submitting, setSubmitting] = useState(false)

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
            username: identifier(user, 'username'),
            phone: identifier(user, 'phone_number'),
            email: identifier(user, 'email'),
        }))
    }, [user, reset])

    const onSubmit = async (data) => {
        setSubmitting(true)
        // TODO: اتصال به سرویس بک‌اند
        console.log('ticket payload:', data)
        setSubmitting(false)
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
                                    options={DEPARTMENTS}
                                    value={field.value}
                                    onChange={field.onChange}
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

                    <div className={styles.actions}>
                        <Button type="submit" disabled={!isValid} loading={submitting}>
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