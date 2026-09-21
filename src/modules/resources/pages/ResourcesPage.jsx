import { Flame, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import Clients from '../../home/components/Clients/Clients'
import CtaBox from '../../marketing/components/CtaBox/CtaBox'
import SectionHeader from '../../marketing/components/SectionHeader/SectionHeader'
import heroImage from '../../../assets/images/illustrations/resources-hero.svg'
import {
    CATEGORIES,
    FEATURED,
    POPULAR,
    TOPICS,
} from '../content/resourcesContent'
import styles from './ResourcesPage.module.css'

/**
 * مرکز منابع.
 *
 * ⚠️ این صفحه عمداً **ویترین** است نه کتابخانه: هیچ‌کدام از منابعی که
 * معرفی می‌کند (مستندات، پایگاه دانش، Release Notes، فایل‌های PDF)
 * هنوز وجود ندارند. جزئیاتش در `content/resourcesContent.js`.
 *
 * به‌همین دلیل جعبه‌ی جستجوی اسپک هم اینجا نیست: جستجویی که چیزی برای
 * گشتن ندارد، کاربر را فریب می‌دهد. جایش یک توضیح صادقانه آمده.
 */
export default function ResourcesPage() {
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
                                <span className={styles.current}>منابع</span>
                            </nav>

                            <h1 className={styles.heroTitle}>مرکز منابع NGCorion</h1>
                            <p className={styles.heroLead}>
                                به مستندات، راهنماها، مقالات، نسخه‌ها و منابع موردنیاز
                                برای استفاده بهتر از NGCorion دسترسی داشته باشید.
                            </p>

                            {/* اسپک اینجا جعبه‌ی جستجو داشت. تا وقتی هیچ
                                منبعی منتشر نشده، جستجو همیشه «چیزی پیدا
                                نشد» می‌دهد — یعنی وعده‌ای که پشتش خالی
                                است. به‌جایش وضعیت واقعی گفته می‌شود. */}
                            <p className={styles.notice}>
                                این بخش در حال تکمیل است. منابع به‌تدریج منتشر
                                می‌شوند؛ تا آن زمان برای هر سؤالی می‌توانید از
                                تیکتینگ یا تماس با ما استفاده کنید.
                            </p>

                            <div className={styles.topics}>
                                <span className={styles.topicsLabel}>
                                    موضوعات پربحث:
                                </span>
                                {TOPICS.map((topic) => (
                                    <span key={topic} className={styles.topic}>
                                        {topic}
                                    </span>
                                ))}
                            </div>
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
                            title="دسته‌بندی منابع"
                            subtitle="به‌سرعت به بخش موردنظر خود دسترسی پیدا کنید."
                        />

                        <ul className={styles.grid}>
                            {CATEGORIES.map(
                                ({ id, icon: Icon, title, description, linkLabel, ready, to }) => (
                                    <li key={id} className={styles.card}>
                                        <span className={styles.cardIcon} aria-hidden="true">
                                            <Icon size={28} />
                                        </span>
                                        <h3 className={styles.cardTitle}>{title}</h3>
                                        <p className={styles.cardText}>{description}</p>

                                        {ready && to ? (
                                            <Link to={to} className={styles.cardLink}>
                                                {linkLabel}
                                                <ArrowLeft size={14} aria-hidden="true" />
                                            </Link>
                                        ) : (
                                            <span className={styles.cardSoon}>به‌زودی</span>
                                        )}
                                    </li>
                                )
                            )}
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <SectionHeader
                            title="منابع پیشنهادی"
                            subtitle="مهم‌ترین و پرکاربردترین منابع برای شروع کار یا عمیق‌تر شدن در موضوعات مختلف."
                        />

                        <ul className={styles.featuredGrid}>
                            {FEATURED.map(({ id, icon: Icon, badge, title, description }) => (
                                <li key={id} className={styles.featured}>
                                    <div className={styles.featuredTop}>
                                        <span className={styles.featuredIcon} aria-hidden="true">
                                            <Icon size={18} />
                                        </span>
                                        <span className={styles.featuredBadge}>{badge}</span>
                                    </div>

                                    <h3 className={styles.featuredTitle}>{title}</h3>
                                    <p className={styles.featuredText}>{description}</p>
                                    <span className={styles.featuredSoon}>به‌زودی منتشر می‌شود</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <div className={styles.split}>
                        <aside className={styles.popular}>
                            <h2 className={styles.popularTitle}>
                                <Flame size={20} aria-hidden="true" />
                                منابع پرطرفدار
                            </h2>

                            <ol className={styles.popularList}>
                                {POPULAR.map((item, i) => (
                                    <li key={item} className={styles.popularItem}>
                                        <span className={styles.popularNum}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ol>
                        </aside>

                        <div className={styles.splitCta}>
                            <CtaBox
                                title="پاسخ سؤال خود را پیدا نکردید؟"
                                description="اگر در منابع موجود به پاسخ موردنظر خود نرسیدید، با تیم ما در ارتباط باشید."
                                primaryLabel="ارسال درخواست پشتیبانی"
                                primaryTo="/helpdesk"
                                secondaryLabel="تماس با ما"
                                secondaryTo="/contact"
                                imageSide="end"
                            />
                        </div>
                    </div>
                </div>

                <Clients />
            </main>

            <Footer />
        </div>
    )
}
