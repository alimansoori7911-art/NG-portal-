import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import CtaBox from '../../marketing/components/CtaBox/CtaBox'
import { usePublicPage } from '../hooks/usePublicPages'
import styles from './ArticlePage.module.css'

/**
 * یک مقاله‌ی منتشرشده.
 *
 * ⚠️ `content_html` با `dangerouslySetInnerHTML` نمایش داده می‌شود چون
 * خروجی ویرایشگر CMS است. **پاک‌سازی این HTML کار بک‌اند است** — این
 * صفحه عمومی است و اگر سرور sanitize نکند، همین‌جا راه XSS باز
 * می‌شود. در BACKEND_REQUESTS.md هم ثبت شده.
 */
export default function ArticlePage() {
    const { slug } = useParams()
    const { data, error, loading, redirectedTo } = usePublicPage(slug)

    /* عنوان مرورگر و توضیح سئو از خود صفحه می‌آیند */
    useEffect(() => {
        if (!data) return

        const prevTitle = document.title
        document.title = data.seo?.meta_title || `${data.title} | NGCorion`

        const desc = data.seo?.meta_description || data.excerpt
        let tag = null
        let created = false
        if (desc) {
            tag = document.querySelector('meta[name="description"]')
            if (!tag) {
                tag = document.createElement('meta')
                tag.setAttribute('name', 'description')
                document.head.appendChild(tag)
                created = true
            }
            tag.setAttribute('content', desc)
        }

        return () => {
            document.title = prevTitle
            if (created && tag) tag.remove()
        }
    }, [data])

    /* اسلاگ عوض شده — به نشانی تازه می‌رویم و این یکی را در تاریخچه
       جا نمی‌گذاریم، تا دکمه‌ی برگشت کاربر را در حلقه نیندازد. */
    if (redirectedTo) {
        return <Navigate to={`/resources/articles/${redirectedTo}`} replace />
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
                        <Link to="/resources/articles" className={styles.crumb}>
                            مقاله‌ها
                        </Link>
                    </nav>

                    {loading ? (
                        <p className={styles.state}>در حال دریافت…</p>
                    ) : error ? (
                        <div className={styles.notFound}>
                            <h1 className={styles.notFoundTitle}>مقاله پیدا نشد</h1>
                            <p className={styles.state}>
                                این مقاله وجود ندارد یا هنوز منتشر نشده است.
                            </p>
                            <Link to="/resources/articles" className={styles.back}>
                                <ArrowRight size={15} aria-hidden="true" />
                                بازگشت به فهرست مقاله‌ها
                            </Link>
                        </div>
                    ) : (
                        <article className={styles.article}>
                            <header className={styles.head}>
                                <h1 className={styles.title}>{data.title}</h1>

                                {data.excerpt && (
                                    <p className={styles.excerpt}>{data.excerpt}</p>
                                )}

                                <div className={styles.meta}>
                                    {data.tags?.map((t) => (
                                        <Link
                                            key={t.id ?? t.slug ?? t.name}
                                            to={`/resources/articles?tag=${encodeURIComponent(
                                                t.slug ?? t.name
                                            )}`}
                                            className={styles.tag}
                                        >
                                            {t.name}
                                        </Link>
                                    ))}
                                </div>
                            </header>

                            {/* HTML از CMS — پاک‌سازی سمت سرور */}
                            <div
                                className={styles.content}
                                dangerouslySetInnerHTML={{
                                    __html:
                                        data.content_html ||
                                        '<p>این صفحه هنوز محتوایی ندارد.</p>',
                                }}
                            />

                            <Link to="/resources/articles" className={styles.back}>
                                <ArrowRight size={15} aria-hidden="true" />
                                بازگشت به فهرست مقاله‌ها
                            </Link>
                        </article>
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
