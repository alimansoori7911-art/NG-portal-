import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import Input from '../../../../components/ui/Input/Input'
import Button from '../../../../components/ui/Button/Button'
import Alert from '../../../../components/ui/Alert/Alert'
import ProfileCard from '../components/ProfileCard/ProfileCard'
import IdentityForm from '../components/IdentityForm/IdentityForm'
import { authService, parseValidationErrors } from '../../../../services/authService'
import { broadcastLogout } from '../../../../services/api'
import { useAuthStore } from '../../../../store/authStore'
import { HTTP, MSG } from '../../../../constants/auth'
import styles from './AccountPage.module.css'

/* همان قاعده‌ی صفحه‌ی بازیابی رمز — اسپک حداقلی تعریف نکرده و
   اعتبارسنجی واقعی سمت بک‌اند است، ولی گرفتن خطای زودهنگام بهتر از
   رفت‌وبرگشت بی‌فایده به سرور است. */
const MIN_PASSWORD_LENGTH = 8

const EMPTY = { current: '', next: '', confirm: '' }

/**
 * حساب کاربری — فعلاً فقط تغییر رمز عبور.
 *
 * وصل به `POST /auth/password/change`. این فرم تا اسپک ۱۳ قابل ساخت
 * نبود چون `ChangedInput` رمز فعلی نمی‌گرفت؛ حالا `old_password`
 * اجباری است و بک‌اند واقعاً بررسی‌اش می‌کند.
 *
 * ⚠️ بعد از تغییر موفق رمز، بک‌اند **رفرش‌توکن را باطل می‌کند** (تأیید
 * شده). پس نشست فعلی مرده است و کاربر باید دوباره وارد شود — دقیقاً
 * مثل «خروج از همه دستگاه‌ها». اگر این کار را نکنیم کاربر با نشستی
 * ادامه می‌دهد که تا اولین ۴۰۱ به‌ظاهر سالم است.
 */
export default function AccountPage() {
    const user = useAuthStore((s) => s.user)
    const refreshUser = useAuthStore((s) => s.refreshUser)
    const sessionExpired = useAuthStore((s) => s.sessionExpired)

    const [form, setForm] = useState(EMPTY)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [notice, setNotice] = useState('')
    const [noticeVariant, setNoticeVariant] = useState('error')
    /* بین تغییر موفق رمز و خروج خودکار — فرم قفل می‌ماند */
    const [loggingOut, setLoggingOut] = useState(false)

    const setField = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }))
        /* خطای همان فیلد با تایپ پاک می‌شود تا کاربر پیام کهنه نبیند */
        setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
    }

    const showError = (message) => {
        setNoticeVariant('error')
        setNotice(message)
    }

    /* بعد از تأیید هویت، پروفایل دوباره از سرور خوانده می‌شود تا نام
       و نشان «تأیید شده» در همین صفحه و سایدبار به‌روز شود.
       اگر این درخواست شکست بخورد پیام موفقیت را نگه می‌داریم — تأیید
       واقعاً انجام شده و فقط نمایش عقب مانده است. */
    const handleVerified = async (message) => {
        setNoticeVariant('success')
        setNotice(message || 'اطلاعات هویتی با موفقیت ثبت شد')

        try {
            await refreshUser()
        } catch {
            /* نمایش با رفرش صفحه درست می‌شود */
        }
    }

    const validate = () => {
        const next = {}

        if (!form.current) {
            next.current = 'رمز عبور فعلی را وارد کنید'
        }
        if (form.next.length < MIN_PASSWORD_LENGTH) {
            /* رقم فارسی نوشته می‌شود چون بقیه‌ی پیام‌های پروژه همین‌طورند */
            next.next = 'رمز عبور حداقل ۸ کاراکتر باشد'
        }
        if (form.confirm !== form.next) {
            next.confirm = 'تکرار رمز عبور یکسان نیست'
        }
        /* رمز جدیدِ برابر با رمز فعلی یعنی کاربر عملاً کاری نکرده؛
           بک‌اند هم احتمالاً ردش می‌کند. */
        if (form.current && form.next && form.current === form.next) {
            next.next = 'رمز جدید باید با رمز فعلی متفاوت باشد'
        }

        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setNotice('')

        if (!validate()) return

        setLoading(true)
        try {
            await authService.changePassword({
                old_password: form.current,
                new_password: form.next,
            })

            setForm(EMPTY)
            setErrors({})
            setNoticeVariant('success')
            setNotice('رمز عبور تغییر کرد. برای ادامه دوباره وارد شوید…')

            /* رفرش‌توکن باطل شده، پس نشست فعلی دیگر معتبر نیست.
               `sessionExpired` استفاده می‌شود نه `logout`: کوکی از قبل
               سمت سرور باطل شده و `POST /auth/logout` فقط یک ۴۰۱
               بی‌فایده می‌گیرد. `broadcastLogout` بقیه‌ی تب‌ها را هم
               پاک می‌کند.

               یک مکث کوتاه تا کاربر پیام موفقیت را ببیند؛ بدون آن
               ProtectedRoute بلافاصله به /login می‌برد و کاربر
               نمی‌فهمد رمزش عوض شد یا نه. */
            setTimeout(() => {
                sessionExpired()
                broadcastLogout()
            }, 1500)

            /* `loading` عمداً true می‌ماند تا در این ۱.۵ ثانیه فرم
               دوباره فعال نشود و کاربر رمز را دوبار نفرستد. */
            setLoggingOut(true)
            return
        } catch (err) {
            /* ۴۰۱/۴۰۳ اینجا یعنی «رمز فعلی اشتباه است»، نه انقضای نشست:
               اگر توکن منقضی بود، interceptor خودش رفرش می‌کرد و اگر
               آن هم شکست می‌خورد کاربر را از سیستم خارج می‌کرد. */
            if (
                err.status === HTTP.UNAUTHORIZED ||
                err.status === HTTP.FORBIDDEN ||
                err.status === HTTP.BAD_REQUEST
            ) {
                setErrors({ current: 'رمز عبور فعلی صحیح نیست' })
            } else if (err.status === HTTP.VALIDATION_ERROR) {
                /* بک‌اند قواعد رمز را خودش دارد (مثلاً پیچیدگی)؛
                   پیام دقیقش را روی همان فیلد نشان می‌دهیم. */
                const fields = parseValidationErrors(err.details)
                const mapped = {}
                if (fields.old_password) mapped.current = fields.old_password
                if (fields.new_password) mapped.next = fields.new_password

                if (Object.keys(mapped).length > 0) {
                    setErrors(mapped)
                } else {
                    showError(err.message || MSG.GENERIC)
                }
            } else if (err.status === HTTP.TOO_MANY_REQUESTS) {
                showError(MSG.RATE_LIMIT)
            } else {
                showError(err.message || MSG.GENERIC)
            }
        } finally {
            setLoading(false)
        }
    }

    /* دکمه تا پر شدن هر سه فیلد غیرفعال است — جلوی درخواستی که
       حتماً رد می‌شود را می‌گیرد. */
    const canSubmit = form.current && form.next && form.confirm

    return (
        <div className={styles.page}>
            <Alert variant={noticeVariant} onClose={() => setNotice('')}>
                {notice}
            </Alert>

            <ProfileCard user={user} />

            {/* فرم تأیید هویت فقط تا وقتی نمایش داده می‌شود که هویت
                تأیید نشده باشد — بعد از آن کاربر راهی برای ویرایش ندارد
                چون اندپوینت ویرایش پروفایل وجود ندارد. */}
            {user && !user.is_verified && (
                <IdentityForm onVerified={handleVerified} />
            )}

            <section className={styles.card}>
                <header className={styles.cardHeader}>
                    <KeyRound size={22} className={styles.cardIcon} />
                    <div>
                        <h2 className={styles.cardTitle}>تغییر رمز عبور</h2>
                        <p className={styles.cardHint}>
                            برای تغییر رمز، ابتدا رمز فعلی خود را وارد کنید. رمز
                            جدید باید حداقل ۸ کاراکتر باشد.
                        </p>
                    </div>
                </header>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    {/* نام کاربری پنهان — به پسورد‌منیجر می‌گوید این رمز
                        مربوط به کدام حساب است. بدون آن، ذخیره‌ی رمز جدید
                        در مرورگر درست کار نمی‌کند. */}
                    <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={user?.username?.value ?? ''}
                        readOnly
                        hidden
                    />

                    <Input
                        label="رمز عبور فعلی"
                        type="password"
                        value={form.current}
                        onChange={setField('current')}
                        error={errors.current}
                        autoComplete="current-password"
                    />

                    <Input
                        label="رمز عبور جدید"
                        type="password"
                        value={form.next}
                        onChange={setField('next')}
                        error={errors.next}
                        autoComplete="new-password"
                    />

                    <Input
                        label="تکرار رمز عبور جدید"
                        type="password"
                        value={form.confirm}
                        onChange={setField('confirm')}
                        error={errors.confirm}
                        autoComplete="new-password"
                    />

                    <div className={styles.actions}>
                        <Button
                            type="submit"
                            loading={loading || loggingOut}
                            disabled={!canSubmit || loggingOut}
                        >
                            تغییر رمز عبور
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    )
}
