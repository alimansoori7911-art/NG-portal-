import { Flame, ArrowLeft, FileText } from 'lucide-react'
import NamedIcon from '../../../components/ui/icons/NamedIcon'
import { Link } from 'react-router-dom'
import { useCmsContent } from '../../../hooks/useCmsContent'
import { resolveIcon } from '../../../utils/iconMap'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import Clients from '../../home/components/Clients/Clients'
import CtaBox from '../../marketing/components/CtaBox/CtaBox'
import SectionHeader from '../../marketing/components/SectionHeader/SectionHeader'
import heroImage from '../../../assets/images/illustrations/resources-hero.svg'
import {
    CATEGORIES,
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
    /* ✅ محتوای صفحه از CMS — یک‌بار اینجا خوانده می‌شود.
       خطا عمداً نادیده گرفته می‌شود: هر بخش متن پیش‌فرض خودش
       را دارد و صفحه‌ی فروش نباید به‌خاطر CMS سفید شود. */
    const cms = useCmsContent('resources')


    /* متن از CMS؛ متن فعلی پیش‌فرض می‌ماند */
    const hero = cms?.fields?.('hero', {
        heading: 'مرکز منابع NGCorion',
        subheading:
            'به مستندات، راهنماها، مقالات، نسخه‌ها و منابع موردنیاز برای استفاده بهتر از NGCorion دسترسی داشته باشید.',
    }) ?? {}

    const topics = cms?.items?.('topics', TOPICS) ?? TOPICS

    /* از CMS فقط متن و اسم آیکون می‌آید. مقصد کارت (`to`,
       `linkLabel`) وضعیت راوتر است و طبق CMS_CONTRACT.md در کد
       می‌ماند؛ با عنوان به کارت CMS وصل می‌شود. دسته‌ای که ادمین تازه
       ساخته و در کد نیست، به مقاله‌های برچسب هم‌نامش می‌رود — همان
       الگوی بقیه‌ی دسته‌ها — تا هیچ کارتی بی‌لینک نماند. */
    const categories = (cms?.items?.('categories', CATEGORIES) ?? CATEGORIES).map(
        (it, i) => {
            const known = CATEGORIES.find((c) => c.title === it.title?.trim())
            return {
                ...it,
                id: known?.id ?? `${it.title}-${i}`,
                icon: resolveIcon(it.icon, known?.icon ?? CATEGORIES[i]?.icon ?? CATEGORIES[0].icon),
                linkLabel: known?.linkLabel ?? 'مشاهده منابع',
                to:
                    known?.to ??
                    `/resources/articles?tag=${encodeURIComponent(it.title?.trim() ?? '')}`,
            }
        }
    )

    /* منابع پیشنهادی — فقط از CMS، بدون متن پیش‌فرض.

       قبلاً کارت‌های ثابتی بود که وعده‌ی PDFهایی را می‌داد که وجود
       نداشتند («به‌زودی منتشر می‌شود») و برداشته شد. حالا تا ادمین در
       بلوک `featured` ردیفی نگذارد، این بخش اصلاً نمایش داده نمی‌شود. هر
       کارت به مقاله‌های برچسب هم‌نام «نشان» خودش می‌رود؛ همان الگوی
       دسته‌بندی‌ها. */
    const featured = cms?.items?.('featured', []) ?? []

    const popularHead = cms?.fields?.('popular', { section_title: 'منابع پرطرفدار' }) ?? {}
    const popular = cms?.items?.('popular', POPULAR) ?? POPULAR
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

                            <h1 className={styles.heroTitle}>{hero.heading}</h1>
                            <p className={styles.heroLead}>
                                {hero.subheading}
                            </p>

                            {/* راه مستقیم به همه‌ی مقاله‌های منتشرشده‌ی CMS */}
                            <p className={styles.notice}>
                                <span>
                                    همه‌ی راهنماها و مقاله‌ها را در{' '}
                                    <Link to="/resources/articles" className={styles.noticeLink}>
                                        فهرست مقاله‌ها
                                    </Link>{' '}
                                    ببینید. اگر پاسخ سؤالتان را پیدا نکردید، از
                                    تیکتینگ یا تماس با ما کمک بگیرید.
                                </span>
                            </p>

                            <div className={styles.topics}>
                                <span className={styles.topicsLabel}>
                                    موضوعات پربحث:
                                </span>
                                {topics.map(({ label }, i) => (
                                    <span key={`${label}-${i}`} className={styles.topic}>
                                        {label}
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
                            {categories.map(
                                ({ id, icon: Icon, title, description, linkLabel, to }) => (
                                    <li key={id} className={styles.card}>
                                        <span className={styles.cardIcon} aria-hidden="true">
                                            <Icon size={28} />
                                        </span>
                                        <h3 className={styles.cardTitle}>{title}</h3>
                                        <p className={styles.cardText}>{description}</p>

                                        <Link to={to} className={styles.cardLink}>
                                            {linkLabel}
                                            <ArrowLeft size={14} aria-hidden="true" />
                                        </Link>
                                    </li>
                                )
                            )}
                        </ul>
                    </section>

                    {featured.length > 0 && (
                        <section className={styles.section}>
                            <SectionHeader
                                title="منابع پیشنهادی"
                                subtitle="مهم‌ترین و پرکاربردترین منابع برای شروع کار یا عمیق‌تر شدن در موضوعات مختلف."
                            />

                            <ul className={styles.featuredGrid}>
                                {featured.map(({ title, description, badge, icon }, i) => (
                                    <li key={`${title}-${i}`} className={styles.featured}>
                                        <div className={styles.featuredTop}>
                                            <span className={styles.featuredIcon} aria-hidden="true">
                                                <NamedIcon name={icon} fallback={FileText} size={18} />
                                            </span>
                                            {badge && (
                                                <span className={styles.featuredBadge}>{badge}</span>
                                            )}
                                        </div>
                                        <h3 className={styles.featuredTitle}>{title}</h3>
                                        {description && (
                                            <p className={styles.featuredText}>{description}</p>
                                        )}
                                        <Link
                                            to={
                                                badge
                                                    ? `/resources/articles?tag=${encodeURIComponent(badge)}`
                                                    : '/resources/articles'
                                            }
                                            className={`${styles.cardLink} ${styles.featuredLink}`}
                                        >
                                            مشاهده
                                            <ArrowLeft size={14} aria-hidden="true" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <div className={styles.split}>
                        <aside className={styles.popular}>
                            <h2 className={styles.popularTitle}>
                                <Flame size={20} aria-hidden="true" />
                                {popularHead.section_title}
                            </h2>

                            <ol className={styles.popularList}>
                                {popular.map(({ label }, i) => (
                                    <li key={`${label}-${i}`} className={styles.popularItem}>
                                        <span className={styles.popularNum}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        {label}
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
