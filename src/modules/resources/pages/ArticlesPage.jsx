import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import CtaBox from '../../marketing/components/CtaBox/CtaBox'
import SectionHeader from '../../marketing/components/SectionHeader/SectionHeader'
import { usePublicPages } from '../hooks/usePublicPages'
import styles from './ArticlesPage.module.css'

/**
 * فهرست مقاله‌های منتشرشده — خروجی عمومی ماژول CMS.
 *
 * تا پیش از این، ادمین صفحه می‌ساخت و منتشر می‌کرد ولی هیچ‌جای سایت
 * نشانش نمی‌داد. این صفحه همان حلقه را می‌بندد.
 *
 * فیلتر برچسب در آدرس می‌نشیند (`?tag=...`) تا لینک‌دادنی باشد و
 * رفرش حالتش را نبازد.
 */
export default function ArticlesPage() {
    const [params, setParams] = useSearchParams()
    const tag = params.get('tag') || undefined

    const { items, error, loading } = usePublicPages({ limit: 50, tag })

    /* برچسب‌ها از خودِ مقاله‌ها ساخته می‌شوند — اسپک مسیر جدا برای
       فهرست برچسب‌ها ندارد. */
    const tags = [
        ...new Map(
            items
                .flatMap((p) => p.tags ?? [])
                .map((t) => [t.slug ?? t.name, t])
        ).values(),
    ]

    const setTag = (next) => {
        if (!next) setParams({})
        else setParams({ tag: next })
    }

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
                        <Link to="/" className={styles.crumb}>
                            خانه
                        </Link>
                        <span aria-hidden="true">/</span>
                        <Link to="/resources" className={styles.crumb}>
                            منابع
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span className={styles.current}>مقاله‌ها</span>
                    </nav>

                    <SectionHeader
                        title="مقاله‌ها و راهنماها"
                        subtitle="آخرین مطالب منتشرشده‌ی تیم NGCorion."
                    />

                    {/* فیلتر برچسب فقط وقتی معنا دارد که برچسبی باشد */}
                    {tags.length > 0 && (
                        <div className={styles.tags}>
                            <button
                                type="button"
                                className={`${styles.tag} ${!tag ? styles.tagActive : ''}`}
                                onClick={() => setTag(null)}
                            >
                                همه
                            </button>

                            {tags.map((t) => (
                                <button
                                    key={t.slug ?? t.name}
                                    type="button"
                                    className={`${styles.tag} ${
                                        tag === (t.slug ?? t.name) ? styles.tagActive : ''
                                    }`}
                                    onClick={() => setTag(t.slug ?? t.name)}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <p className={styles.state}>در حال دریافت…</p>
                    ) : error ? (
                        <p className={styles.state} role="alert">
                            {error}
                        </p>
                    ) : items.length === 0 ? (
                        <p className={styles.state}>
                            {tag
                                ? 'برای این برچسب مقاله‌ای منتشر نشده است.'
                                : 'هنوز مقاله‌ای منتشر نشده است.'}
                        </p>
                    ) : (
                        <ul className={styles.grid}>
                            {items.map((p) => (
                                <li key={p.id} className={styles.card}>
                                    <span className={styles.cardIcon} aria-hidden="true">
                                        <FileText size={20} />
                                    </span>

                                    <h2 className={styles.cardTitle}>
                                        <Link
                                            to={`/resources/articles/${p.slug}`}
                                            className={styles.cardLinkTitle}
                                        >
                                            {p.title}
                                        </Link>
                                    </h2>

                                    {p.excerpt && (
                                        <p className={styles.cardText}>{p.excerpt}</p>
                                    )}

                                    <div className={styles.cardFoot}>
                                        {p.publishedLabel && (
                                            <span className={styles.date} dir="ltr">
                                                {p.publishedLabel}
                                            </span>
                                        )}

                                        <Link
                                            to={`/resources/articles/${p.slug}`}
                                            className={styles.cardLink}
                                        >
                                            خواندن
                                            <ArrowLeft size={14} aria-hidden="true" />
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className={styles.cta}>
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
            </main>

            <Footer />
        </div>
    )
}
