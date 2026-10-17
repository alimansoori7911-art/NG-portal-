import { useState } from 'react'
import styles from './Footer.module.css'
import logo from '../../../assets/images/logo/logowhite.png'
import { Mail, Phone, MapPin, Send, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { contactService } from '../../../services/contactService'
import { useCmsContent } from '../../../hooks/useCmsContent'
import Captcha from '../../ui/Captcha/Captcha'
import { HTTP, MSG, CAPTCHA_ERROR_CODE } from '../../../constants/auth'
import { useCaptcha } from '../../../hooks/useCaptcha'

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/* متن پیش‌فرض هر بلوک `site_footer` — همان چیزی که اگر CMS بالا
   نیامد یا صفحه منتشر نشده بود دیده می‌شود. */
const ABOUT = {
    heading: '',
    body: 'پلتفرم یکپارچه‌ی مدیریت انطباق امنیتی و تحلیل ریسک زیرساخت.',
}

const CONTACT = {
    email: 'Info@ngcorion.com',
    phone: '02122500058',
    address: '',
}

/* `link_groups` یک CARD_LIST تخت است؛ هر آیتم `group_title` خودش را
   دارد و ستون‌ها از روی همان ساخته می‌شوند (ترتیب اولین ظهور). */
const LINKS = [
    { group_title: 'لینک های سریع', label: 'تماس با ما', url: '/contact' },
    { group_title: 'لینک های سریع', label: 'درباره ما', url: '/company' },
    { group_title: 'لینک های سریع', label: 'سوالات متداول', url: '/resources/articles' },
]

const NEWSLETTER = {
    heading: 'عضویت در خبرنامه',
    placeholder: 'آدرس ایمیل خود را وارد کنید',
    button_label: 'عضویت در خبرنامه',
}

function groupLinks(items) {
    const groups = new Map()
    for (const it of items) {
        if (!it?.label) continue
        const title = it.group_title?.trim() || ''
        if (!groups.has(title)) groups.set(title, [])
        groups.get(title).push(it)
    }
    return [...groups].map(([title, links]) => ({ title, links }))
}

/* آدرس لینک از CMS می‌آید، پس فقط شکل‌های امن پذیرفته می‌شوند:
   مسیر داخلی (`/…`) با راوتر، و http(s)/mailto/tel با `<a>`. هر چیز
   دیگری (مثلاً `javascript:`) لینک نمی‌شود و متن ساده می‌ماند. */
function FooterLink({ label, url }) {
    const href = String(url ?? '').trim()

    if (href.startsWith('/') && !href.startsWith('//')) {
        return (
            <Link to={href} className={styles.link}>
                {label}
            </Link>
        )
    }
    if (/^https?:\/\//i.test(href)) {
        return (
            <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
                {label}
            </a>
        )
    }
    if (/^(mailto|tel):/i.test(href)) {
        return (
            <a href={href} className={styles.link}>
                {label}
            </a>
        )
    }
    return <span className={styles.link}>{label}</span>
}

function Footer() {
    /* ✅ محتوای فوتر از CMS (`site_footer`). خطا عمداً نادیده گرفته
       می‌شود: فوتر روی همه‌ی صفحه‌هاست و نباید به‌خاطر CMS خالی شود. */
    const cms = useCmsContent('site_footer')
    const about = cms.fields('about', ABOUT)
    const contact = cms.fields('contact', CONTACT)
    const linkGroups = groupLinks(cms.items('link_groups', LINKS))
    const newsletter = cms.fields('newsletter', NEWSLETTER)

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    /* { type: 'success' | 'error', text } — زیر فیلد نمایش داده می‌شود.
       فوتر ته صفحه است، پس پیام باید کنار خود فیلد باشد نه بالای صفحه. */
    const [feedback, setFeedback] = useState(null)
    const { containerRef: captchaRef, execute: runCaptcha } = useCaptcha()

    const handleSubscribe = async (e) => {
        e.preventDefault()

        if (!isValidEmail(email)) {
            setFeedback({ type: 'error', text: 'ایمیل معتبر وارد کنید' })
            return
        }

        setLoading(true)
        setFeedback(null)
        try {
            const captchaToken = await runCaptcha()
            await contactService.subscribe(email.trim(), { captchaToken })
            setFeedback({ type: 'success', text: 'عضویت شما در خبرنامه ثبت شد' })
            setEmail('')
        } catch (err) {
            if (err.message === 'captcha-failed') {
                setFeedback({
                    type: 'error',
                    text: 'تأیید امنیتی انجام نشد. لطفاً دوباره تلاش کنید.',
                })
            } else if (err.code === CAPTCHA_ERROR_CODE) {
                setFeedback({ type: 'error', text: err.message })
            } else if (err.status === HTTP.TOO_MANY_REQUESTS) {
                setFeedback({ type: 'error', text: MSG.RATE_LIMIT })
            } else if (err.status === HTTP.CONFLICT) {
                // این ایمیل قبلاً ثبت شده — خطا نیست، اطلاع‌رسانی است
                setFeedback({ type: 'success', text: 'این ایمیل قبلاً در خبرنامه ثبت شده است' })
            } else {
                setFeedback({ type: 'error', text: err?.message || MSG.GENERIC })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>

                {/* ستون راست — لوگو + توضیحات + اطلاعات تماس */}
                <div className={styles.col}>
                    <img src={logo} alt="NGcorion" className={styles.logo} />
                    {about.heading && <h4 className={styles.aboutTitle}>{about.heading}</h4>}
                    <p className={styles.description}>{about.body}</p>
                    {(contact.email || contact.phone) && (
                        <div className={styles.contactItems}>
                            {contact.email && (
                                <div className={styles.contactItem}>
                                    <div className={styles.contactInfo}>
                                        <span className={styles.contactLabel}>آدرس ایمیل</span>
                                        <span className={styles.contactValue}>{contact.email}</span>
                                    </div>
                                    <div className={styles.contactIconBox}>
                                        <Mail size={18} />
                                    </div>
                                </div>
                            )}
                            {contact.phone && (
                                <div className={styles.contactItem}>
                                    <div className={styles.contactInfo}>
                                        <span className={styles.contactLabel}>شماره تماس</span>
                                        <span className={styles.contactValue}>{contact.phone}</span>
                                    </div>
                                    <div className={styles.contactIconBox}>
                                        <Phone size={18} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* آدرس بلند است، پس جدا و زیر بقیه با شکستن خط */}
                    {contact.address && (
                        <div className={styles.contactItem}>
                            <div className={styles.contactInfo}>
                                <span className={styles.contactLabel}>آدرس</span>
                                <span className={`${styles.contactValue} ${styles.contactValueWrap}`}>
                                    {contact.address}
                                </span>
                            </div>
                            <div className={styles.contactIconBox}>
                                <MapPin size={18} />
                            </div>
                        </div>
                    )}
                </div>

                {/* ستون وسط — گروه‌های لینک (هر `group_title` یک فهرست) */}
                <div className={`${styles.col} ${styles.linkGroups}`}>
                    {linkGroups.map((group, gi) => (
                        <div key={`${group.title}-${gi}`} className={styles.linkGroup}>
                            {group.title && (
                                <h4 className={`${styles.colTitle} ${styles.withBorder}`}>
                                    {group.title}
                                </h4>
                            )}
                            <ul className={styles.linkList}>
                                {group.links.map((link, i) => (
                                    <li key={`${link.label}-${i}`}>
                                        <FooterLink label={link.label} url={link.url} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* ستون چپ — خبرنامه + شبکه‌های اجتماعی */}
                <div className={styles.col}>
                    <h4 className={styles.colTitle}>{newsletter.heading}</h4>
                    {/* form تا کلید Enter هم فرم را ارسال کند.

                        فرم دورِ ردیف می‌پیچد تا کپچا زیرِ آن بنشیند، نه
                        کنار فیلد و دکمه — `.newsletter` خودش یک ردیف
                        افقی است. */}
                    <form className={styles.newsletterForm} onSubmit={handleSubscribe} noValidate>
                        <div className={styles.newsletter}>
                            <input
                                type="email"
                                placeholder={newsletter.placeholder}
                                className={styles.input}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (feedback) setFeedback(null)
                                }}
                                aria-label="آدرس ایمیل برای عضویت در خبرنامه"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                className={styles.inputBtn}
                                disabled={loading}
                                aria-label={newsletter.button_label}
                                title={newsletter.button_label}
                            >
                                {loading ? (
                                    <LoaderCircle size={16} className={styles.spinner} />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </div>

                        <Captcha ref={captchaRef} />
                    </form>

                    {feedback && (
                        <p
                            className={`${styles.feedback} ${
                                feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
                            }`}
                            role="status"
                        >
                            {feedback.text}
                        </p>
                    )}
                    <div className={styles.socialWrapper}>
                        <span className={styles.socialLabel}>ما را در شبکه های اجتماعی دنبال کنید</span>
                        <div className={styles.socialIcons}>
                            <button className={styles.socialBtn} aria-label="اینستاگرام">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                    <circle cx="12" cy="12" r="4"/>
                                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                                </svg>
                            </button>
                            <button className={styles.socialBtn} aria-label="واتساپ">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                </svg>
                            </button>
                            <button className={styles.socialBtn} aria-label="تلگرام">
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    )
}

export default Footer