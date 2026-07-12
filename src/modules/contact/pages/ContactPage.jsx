import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Mail, Check } from 'lucide-react'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import Input from '../../../components/ui/Input/Input'
import Select from '../../../components/ui/Select/Select'
import Button from '../../../components/ui/Button/Button'
import Alert from '../../../components/ui/Alert/Alert'
import { contactService } from '../../../services/contactService'
import { useAuthStore, getDisplayName } from '../../../store/authStore'
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

function ContactPage() {
    const navigate = useNavigate()
    const { user, status } = useAuthStore()
    const isLoggedIn = status === 'authenticated'

    const [view, setView] = useState('form') // form | success | requests
    const [loading, setLoading] = useState(false)
    const [alert, setAlert] = useState({ message: '', variant: 'error' })

    const [requestType, setRequestType] = useState('')
    const [assetCount, setAssetCount] = useState('')
    const [description, setDescription] = useState('')

    const [requests, setRequests] = useState([])
    const [requestsLoading, setRequestsLoading] = useState(false)

    // نمایش پیام «وارد حساب شوید» برای مهمان‌ها
    useEffect(() => {
        if (status === 'guest') {
            setAlert({
                message: 'کاربر گرامی جهت ثبت درخواست وارد حساب کاربری خود شوید',
                variant: 'error',
            })
        } else {
            setAlert({ message: '', variant: 'error' })
        }
    }, [status])

    // اطلاعات کاربر از حساب کاربری مپ می‌شود (فقط‌خواندنی)
    const identifierOf = (type) => user?.identifiers?.find((i) => i.type === type)?.value ?? ''
    const prefill = {
        username: getDisplayName(user),
        email: identifierOf('email'),
        phone: identifierOf('phone_number'),
        organization: '', // TODO: پس از افزودن فیلد سازمان به پروفایل بک‌اند تکمیل می‌شود
    }

    const canSubmit = isLoggedIn && requestType && assetCount && !loading

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!canSubmit) return
        setAlert({ message: '', variant: 'error' })
        setLoading(true)
        try {
            await contactService.submitRequest({
                request_type: requestType,
                asset_count: assetCount,
                description: description.trim(),
            })
            setAlert({ message: 'عملیات با موفقیت انجام شد', variant: 'success' })
            setView('success')
        } catch {
            setAlert({ message: 'خطا در بارگذاری، مجدداً تلاش کنید', variant: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const openRequests = async () => {
        setView('requests')
        setAlert({ message: '', variant: 'error' })
        setRequestsLoading(true)
        try {
            const data = await contactService.getMyRequests()
            setRequests(Array.isArray(data) ? data : [])
        } catch {
            setRequests([])
            setAlert({ message: 'خطا در بارگذاری، مجدداً تلاش کنید', variant: 'error' })
        } finally {
            setRequestsLoading(false)
        }
    }

    const backToForm = () => {
        setRequestType('')
        setAssetCount('')
        setDescription('')
        setAlert({ message: '', variant: 'error' })
        setView('form')
    }

    return (
        <div className={styles.page}>
            <Header />

            <Alert
                variant={alert.variant}
                onClose={() => setAlert({ message: '', variant: 'error' })}
            >
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
                                    <Input label="نام کاربری" value={prefill.username} disabled />
                                    <Input label="نام سازمان" value={prefill.organization} disabled />
                                    <Input label="شماره تماس" value={prefill.phone} disabled />
                                    <Input label="ایمیل" value={prefill.email} disabled />
                                    <Select
                                        label="نوع درخواست"
                                        options={REQUEST_TYPES}
                                        value={requestType}
                                        onChange={setRequestType}
                                        disabled={!isLoggedIn}
                                    />
                                    <Select
                                        label="تعداد تقریبی دارایی"
                                        options={ASSET_COUNTS}
                                        value={assetCount}
                                        onChange={setAssetCount}
                                        disabled={!isLoggedIn}
                                    />
                                </div>

                                <textarea
                                    className={styles.textarea}
                                    placeholder="توضیحات"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={!isLoggedIn}
                                    rows={5}
                                />

                                <div className={styles.actions}>
                                    <Button type="submit" loading={loading} disabled={!canSubmit}>
                                        ثبت درخواست
                                    </Button>
                                    <button
                                        type="button"
                                        className={styles.secondaryBtn}
                                        onClick={openRequests}
                                        disabled={!isLoggedIn}
                                    >
                                        مشاهده درخواست های قبلی
                                    </button>
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
                            <Button className={styles.successBtn} onClick={openRequests}>
                                مشاهده در خواست ها
                            </Button>
                        </div>
                    )}

                    {view === 'requests' && (
                        <div className={styles.requestsBox}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        <th>ردیف</th>
                                        <th>تاریخ</th>
                                        <th>نوع درخواست</th>
                                        <th>وضعیت</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {requests.map((req, index) => (
                                        <tr key={req.id ?? index}>
                                            <td>{index + 1}</td>
                                            <td>{req.date}</td>
                                            <td>{req.request_type}</td>
                                            <td>{req.status}</td>
                                        </tr>
                                    ))}
                                    {!requestsLoading && requests.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className={styles.emptyRow}>
                                                درخواستی ثبت نشده است
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" className={styles.secondaryBtn} onClick={backToForm}>
                                فرم ثبت درخواست
                            </button>
                        </div>
                    )}

                </section>
            </main>

            <Footer />
        </div>
    )
}

export default Contact