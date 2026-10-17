import { Users, BadgeCheck, Handshake, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCmsContent } from '../../../hooks/useCmsContent'
import { resolveIcon } from '../../../utils/iconMap'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import Clients from '../../home/components/Clients/Clients'
import CtaBox from '../../marketing/components/CtaBox/CtaBox'
import SectionHeader from '../../marketing/components/SectionHeader/SectionHeader'
import heroImage from '../../../assets/images/illustrations/services-hero.svg'
import { SERVICES, LIFECYCLE, ADVANTAGES } from '../content/servicesContent'
import styles from './ServicesPage.module.css'

/* نشانه‌های زیر عنوان hero */
const HERO_POINTS = [
    { icon: Users, label: 'تیم متخصص' },
    { icon: BadgeCheck, label: 'مبتنی بر تجربه عملی' },
    { icon: Handshake, label: 'همراهی بلندمدت' },
]

export default function ServicesPage() {
    /* ✅ محتوای صفحه از CMS — یک‌بار اینجا خوانده می‌شود.
       خطا عمداً نادیده گرفته می‌شود: هر بخش متن پیش‌فرض خودش
       را دارد و صفحه‌ی فروش نباید به‌خاطر CMS سفید شود. */
    const cms = useCmsContent('services')


    /* متن از CMS؛ متن فعلی پیش‌فرض می‌ماند */
    const hero = cms?.fields?.('hero', {
        heading: 'از استقرار تا امنیت مداوم',
        subheading:
            'مجموعه‌ای از خدمات تخصصی برای استقرار، بهره‌برداری و بهبود NGCorion؛ همراه شما در مسیر ساخت زیرساختی امن‌تر و پایدارتر.',
    }) ?? {}

    /* کارت‌ها از CMS؛ `icon` آنجا اسم است (مثلاً `settings`) و
       با `resolveIcon` به کامپوننت تبدیل می‌شود. اسم ناشناخته یا
       خالی آیکون همان ردیف در متن پیش‌فرض را می‌گیرد. */
    const withIcons = (list, defaults) =>
        list.map((it, i) => ({
            ...it,
            icon: resolveIcon(it.icon, defaults[i]?.icon ?? defaults[0]?.icon),
        }))

    const points = withIcons(cms?.items?.('hero_points', HERO_POINTS) ?? HERO_POINTS, HERO_POINTS)

    const servicesHead = cms?.fields?.('services', { section_title: 'خدمات ما' }) ?? {}
    const services = withIcons(cms?.items?.('services', SERVICES) ?? SERVICES, SERVICES)

    const lifecycleHead = cms?.fields?.('lifecycle', {
        section_title: 'چرخه خدمات NGCorion',
    }) ?? {}
    const lifecycle = withIcons(cms?.items?.('lifecycle', LIFECYCLE) ?? LIFECYCLE, LIFECYCLE)

    const advantagesHead = cms?.fields?.('advantages', {
        section_title: 'چرا خدمات NGCorion؟',
    }) ?? {}
    const advantages = withIcons(
        cms?.items?.('advantages', ADVANTAGES) ?? ADVANTAGES,
        ADVANTAGES
    )
    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <section className={styles.hero}>
                        <div className={styles.heroText}>
                            <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
                                <Link to="/" className={styles.crumb}>
                                    خانه
                                </Link>
                                <span aria-hidden="true">/</span>
                                <span className={styles.current}>خدمات</span>
                            </nav>

                            <h1 className={styles.heroTitle}>{hero.heading}</h1>
                            <p className={styles.heroLead}>
                                {hero.subheading}
                            </p>

                            <div className={styles.heroActions}>
                                <Link to="/contact" className={styles.primaryBtn}>
                                    دریافت مشاوره
                                    <ArrowLeft size={18} aria-hidden="true" />
                                </Link>
                                <Link to="/products/buy" className={styles.outlineBtn}>
                                    درخواست دمو
                                </Link>
                            </div>

                            <ul className={styles.heroPoints}>
                                {points.map(({ icon: Icon, label }, i) => (
                                    <li key={`${label}-${i}`} className={styles.heroPoint}>
                                        {Icon && <Icon size={18} aria-hidden="true" />}
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <img
                            src={heroImage}
                            alt=""
                            aria-hidden="true"
                            className={styles.heroImage}
                        />
                    </section>

                    <section className={styles.section}>
                        <SectionHeader
                            align="center"
                            title={servicesHead.section_title}
                            subtitle="خدمات NGCorion متناسب با نیازهای سازمان شما در تمام مراحل چرخه امنیت زیرساخت."
                        />

                        {/* اسپک روی هر کارت لینک «مشاهده جزئیات» داشت، ولی
                            صفحه‌ی جزئیاتِ هیچ خدمتی وجود ندارد. لینک
                            شکسته بدتر از نبودنش است، پس کارت‌ها ساده‌اند
                            و راه ارتباط، همان CTA پایین صفحه است. */}
                        <ul className={styles.grid}>
                            {services.map(({ id, icon: Icon, title, description }, i) => (
                                <li key={id ?? `${title}-${i}`} className={styles.card}>
                                    <span className={styles.cardIcon} aria-hidden="true">
                                        <Icon size={32} />
                                    </span>
                                    <h3 className={styles.cardTitle}>{title}</h3>
                                    <p className={styles.cardText}>{description}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <SectionHeader
                            align="center"
                            title={lifecycleHead.section_title}
                            subtitle="یک مسیر پیوسته برای ساخت، حفظ و بهبود امنیت زیرساخت."
                        />

                        {/* مراحل شماره‌دارند تا ترتیب از خودِ محتوا خوانده
                            شود؛ اسپک هشدار داده بود جهت فلش‌ها در تصویرِ
                            مرجع ناسازگار است. */}
                        <ol className={styles.lifecycle}>
                            {lifecycle.map(({ id, icon: Icon, title, subtitle }, i) => (
                                <li key={id ?? `${title}-${i}`} className={styles.stage}>
                                    <span className={styles.stageDisc}>
                                        <Icon size={34} aria-hidden="true" />
                                        <span className={styles.stageNum}>{i + 1}</span>
                                    </span>
                                    <h3 className={styles.stageTitle}>{title}</h3>
                                    <p className={styles.stageSub}>{subtitle}</p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section className={styles.advantages}>
                        <SectionHeader align="center" title={advantagesHead.section_title} />

                        <ul className={styles.advantageGrid}>
                            {advantages.map(({ id, icon: Icon, title, description }, i) => (
                                <li key={id ?? `${title}-${i}`} className={styles.advantage}>
                                    <span className={styles.advantageIcon} aria-hidden="true">
                                        <Icon size={28} />
                                    </span>
                                    <h3 className={styles.advantageTitle}>{title}</h3>
                                    <p className={styles.advantageText}>{description}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <div className={styles.cta}>
                        <CtaBox
                            title="برای انتخاب خدمت مناسب، با ما مشورت کنید"
                            description="کارشناسان ما آماده پاسخ‌گویی به سؤالات شما هستند."
                            primaryLabel="دریافت مشاوره"
                            primaryTo="/contact"
                            secondaryLabel="تماس با ما"
                            secondaryTo="/contact"
                        />
                    </div>
                </div>

                <Clients />
            </main>

            <Footer />
        </div>
    )
}
