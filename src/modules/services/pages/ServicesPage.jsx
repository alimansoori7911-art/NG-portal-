import { Users, BadgeCheck, Handshake, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
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

                            <h1 className={styles.heroTitle}>
                                از استقرار تا امنیت مداوم
                            </h1>
                            <p className={styles.heroLead}>
                                مجموعه‌ای از خدمات تخصصی برای استقرار، بهره‌برداری و
                                بهبود NGCorion؛ همراه شما در مسیر ساخت زیرساختی امن‌تر
                                و پایدارتر.
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
                                {HERO_POINTS.map(({ icon: Icon, label }) => (
                                    <li key={label} className={styles.heroPoint}>
                                        <Icon size={18} aria-hidden="true" />
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
                            title="خدمات ما"
                            subtitle="خدمات NGCorion متناسب با نیازهای سازمان شما در تمام مراحل چرخه امنیت زیرساخت."
                        />

                        {/* اسپک روی هر کارت لینک «مشاهده جزئیات» داشت، ولی
                            صفحه‌ی جزئیاتِ هیچ خدمتی وجود ندارد. لینک
                            شکسته بدتر از نبودنش است، پس کارت‌ها ساده‌اند
                            و راه ارتباط، همان CTA پایین صفحه است. */}
                        <ul className={styles.grid}>
                            {SERVICES.map(({ id, icon: Icon, title, description }) => (
                                <li key={id} className={styles.card}>
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
                            title="چرخه خدمات NGCorion"
                            subtitle="یک مسیر پیوسته برای ساخت، حفظ و بهبود امنیت زیرساخت."
                        />

                        {/* مراحل شماره‌دارند تا ترتیب از خودِ محتوا خوانده
                            شود؛ اسپک هشدار داده بود جهت فلش‌ها در تصویرِ
                            مرجع ناسازگار است. */}
                        <ol className={styles.lifecycle}>
                            {LIFECYCLE.map(({ id, icon: Icon, title, subtitle }, i) => (
                                <li key={id} className={styles.stage}>
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
                        <SectionHeader align="center" title="چرا خدمات NGCorion؟" />

                        <ul className={styles.advantageGrid}>
                            {ADVANTAGES.map(({ id, icon: Icon, title, description }) => (
                                <li key={id} className={styles.advantage}>
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
