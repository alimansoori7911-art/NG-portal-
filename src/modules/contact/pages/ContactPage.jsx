import { useEffect, useState } from 'react'
import { Phone, Mail, Check } from 'lucide-react'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import Input from '../../../components/ui/Input/Input'
import Select from '../../../components/ui/Select/Select'
import Button from '../../../components/ui/Button/Button'
import Alert from '../../../components/ui/Alert/Alert'
import { contactService } from '../../../services/contactService'
import { useAuthStore, getDisplayName } from '../../../store/authStore'
import { HTTP, MSG } from '../../../constants/auth'
import styles from './ContactPage.module.css'

// آیکون اینستاگرام به‌صورت SVG دستی — مستقل از نسخه‌ی نصب‌شده‌ی lucide-react
function InstagramIcon({ size = 22, className }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    )
}

const REQUEST_TYPES = ['درخواست دمو', 'دریافت پیش فاکتور', 'دریافت کاتالوگ', 'مشاوره فنی']
const ASSET_COUNTS = ['کمتر از 15', 'کمتر از 50', 'کمتر از 150', 'بیشتر از 150']

const CONTACT_CARDS = [
    { icon: Phone, label: 'شماره تلفن', value: '09937791943' },
    { icon: Mail, label: 'ایمیل', value: 'info@ngcorion.com' },
    { icon: InstagramIcon, label: 'اینستاگرام', value: '@ngcorion' },
]

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isValidPhone = (v) => /^(\+98|0)?9\d{9}$/.test(v.trim())

/**
 * اندپوینت /landing/contact فقط { name, email, phone_number, message }
 * می‌پذیرد و فیلدی برای نوع درخواست و تعداد دارایی ندارد؛ این دو مقدار
 * به‌صورت متن ساخت‌یافته داخل message ارسال می‌شوند.
 */
function buildMessage({ requestType, assetCount, description }) {
    const lines = [
        `نوع درخواست: ${requestType}`,
        `تعداد تقریبی دارایی: ${assetCount}`,
    ]
    if (description) lines.push('', `توضیحات: ${description}`)
    return lines.join('\n')
}

function ContactPage() {
    const user = useAuthStore((s) => s.user)
    const status = useAuthStore((s) => s.status)

    const [view, setView] = useState('form') // form | success
    const [loading, setLoading] = useState(false)
    const [alert, setAlert] = useState({ message: '', variant: 'error' })

    // این اندپوینت برای مهمان هم باز است؛ فیلدها قابل ویرایش‌اند و
    // فقط در صورت لاگین بودن، یک‌بار از پروفایل پیش‌پر می‌شوند.
    const [contact, setContact] = useState({ name: '', email: '', phone: '' })
    const [requestType, setRequestType] = useState('')
    const [assetCount, setAssetCount] = useState('')
    const [description, setDescription] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    const clearAlert = () => setAlert({ message: '', variant: 'error' })
    const showError = (message) => setAlert({ message, variant: 'error' })
    const showNotice = (message) => setAlert({ message, variant: 'success' })

    // پیش‌پر کردن از پروفایل — فقط وقتی کاربر لاگین باشد
    useEffect(() => {
        if (status !== 'authenticated' || !user) return
        const identifierOf = (t) =>
            user?.identifiers?.find((i) => i.type === t)?.value ?? ''
        setContact((prev) => ({
            name: prev.name || getDisplayName(user),
            email: prev.email || identifierOf('email'),
            phone: prev.phone || identifierOf('phone_number'),
        }))
    }, [status, user])

    const setContactField = (name) => (e) => {
        setContact((c) => ({ ...c, [name]: e.target.value }))
        setFieldErrors((fe) => ({ ...fe, [name]: '' }))
    }

    const validate = () => {
        const errors = {}
        if (!contact.name.trim()) errors.name = 'نام را وارد کنید'
        if (!isValidEmail(contact.email)) errors.email = 'ایمیل معتبر وارد کنید'
        if (!isValidPhone(contact.phone)) errors.phone = 'شماره تماس معتبر وارد کنید'
        if (!requestType) errors.requestType = 'نوع درخواست را انتخاب کنید'
        if (!assetCount) errors.assetCount = 'تعداد دارایی را انتخاب کنید'
        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        clearAlert()
        if (!validate()) return

        setLoading(true)
        try {
            await contactService.submitRequest({
                name: contact.name.trim(),
                email: contact.email.trim(),
                phone_number: contact.phone.trim(),
                message: buildMessage({
                    requestType,
                    assetCount,
                    description: description.trim(),
                }),
            })
            showNotice('عملیات با موفقیت انجام شد')
            setView('success')
        } catch (err) {
            if (err.status === HTTP.TOO_MANY_REQUESTS) {
                showError(MSG.RATE_LIMIT)
            } else {
                showError(err?.message || MSG.GENERIC)
            }
        } finally {
            setLoading(false)
        }
    }

    const backToForm = () => {
        setRequestType('')
        setAssetCount('')
        setDescription('')
        setFieldErrors({})
        clearAlert()
        setView('form')
    }

    return (
        <div className={styles.page}>
            <Header />

            <Alert variant={alert.variant} onClose={clearAlert}>
                {alert.message}
            </Alert>

            <main className={styles.main}>
                {/* ستون کناری — برچسب صفحه + کارت‌های اطلاعات تماس */}
                <aside className={styles.sidebar}>
                    <span className={styles.pageLabel}>تماس با ما</span>
                    {CONTACT_CARDS.map(({ icon: Icon, label, value }) => (
                        <div key={label} className={styles.infoCard}>
                            <Icon size={22} className={styles.infoIcon} />
                            <span className={styles.infoLabel}>{label}</span>
                            <span className={styles.infoValue}>{value}</span>
                        </div>
                    ))}
                </aside>

                {/* کارت اصلی */}
                <section className={styles.card}>

                    {view === 'form' && (
                        <>
                            <h1 className={styles.title}>ارتباط با تیم NG CORION</h1>
                            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                                <div className={styles.grid}>
                                    <Input
                                        label="* نام و نام خانوادگی"
                                        persian
                                        value={contact.name}
                                        onChange={setContactField('name')}
                                        error={fieldErrors.name}
                                        autoComplete="name"
                                    />
                                    <Input
                                        label="* ایمیل"
                                        type="email"
                                        value={contact.email}
                                        onChange={setContactField('email')}
                                        error={fieldErrors.email}
                                        autoComplete="email"
                                    />
                                    <Input
                                        label="* شماره تماس"
                                        type="tel"
                                        inputMode="numeric"
                                        value={contact.phone}
                                        onChange={setContactField('phone')}
                                        error={fieldErrors.phone}
                                        autoComplete="tel"
                                    />
                                    <Select
                                        label="* نوع درخواست"
                                        options={REQUEST_TYPES}
                                        value={requestType}
                                        onChange={(v) => {
                                            setRequestType(v)
                                            setFieldErrors((fe) => ({ ...fe, requestType: '' }))
                                        }}
                                    />
                                    <Select
                                        label="* تعداد تقریبی دارایی"
                                        options={ASSET_COUNTS}
                                        value={assetCount}
                                        onChange={(v) => {
                                            setAssetCount(v)
                                            setFieldErrors((fe) => ({ ...fe, assetCount: '' }))
                                        }}
                                    />
                                </div>

                                <textarea
                                    className={styles.textarea}
                                    placeholder="توضیحات"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                />

                                <div className={styles.actions}>
                                    <Button type="submit" loading={loading}>
                                        ثبت درخواست
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}

                    {view === 'success' && (
                        <div className={styles.successBox}>
                            <span className={styles.successIcon}>
                                <Check size={40} strokeWidth={3} />
                            </span>
                            <h2 className={styles.successTitle}>فرم با موفقیت ثبت شد</h2>
                            <p className={styles.successDesc}>
                                به زودی کارشناسان ما به در خواست شما رسیدگی خواهند کرد و
                                در صورت نیاز با شما در تماس خواهند بود
                            </p>
                            <Button className={styles.successBtn} onClick={backToForm}>
                                ثبت درخواست جدید
                            </Button>
                        </div>
                    )}

                </section>
            </main>

            <Footer />
        </div>
    )
}

export default ContactPage