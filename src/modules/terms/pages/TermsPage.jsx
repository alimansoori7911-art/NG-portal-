import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Link as LinkIcon, Shield, FileText, Lock, Headset } from 'lucide-react'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import Clients from '../../home/components/Clients/Clients'
import CtaBox from '../../marketing/components/CtaBox/CtaBox'
import TermsHero from '../components/TermsHero/TermsHero'
import TermsToc from '../components/TermsToc/TermsToc'
import TermsSection from '../components/TermsSection/TermsSection'
import { useActiveSection } from '../hooks/useActiveSection'
import { LEGAL_DOCS } from '../content/legalDocs'
import styles from './TermsPage.module.css'

/* چیپ‌های «لینک‌های مرتبط».

   دو تای اول به همین صفحه می‌روند (تب دیگر)، بقیه هنوز صفحه ندارند و
   `to: null` می‌گیرند تا به‌جای لینک شکسته، غیرفعال نشان داده شوند —
   همان قاعده‌ای که هدر برای آیتم‌های «به‌زودی» دارد. */
const RELATED_LINKS = [
    { icon: Shield, label: 'حریم خصوصی', docId: 'privacy' },
    { icon: FileText, label: 'قوانین و مقررات', docId: 'terms' },
    { icon: Lock, label: 'امنیت', to: null },
    { icon: Headset, label: 'پشتیبانی', to: '/helpdesk' },
]

export default function TermsPage() {
    const navigate = useNavigate()
    const location = useLocation()

    /* سند فعال از hash می‌آید تا لینک مستقیم (`/terms#privacy`) کار کند
       و رفرش حالت را نبازد. */
    /* سند فعال **مشتق** از hash است، نه state جدا.

       اول در state نگه داشته می‌شد و یک افکت آن را با hash همگام
       می‌کرد؛ ولی آن افکت هم اضافه بود و هم `set-state-in-effect`
       می‌داد. وقتی hash خودش منبع حقیقت است، نگه‌داشتن نسخه‌ی دومش
       فقط راه دو-منبع-حقیقت‌شدن را باز می‌کند. */
    const doc =
        LEGAL_DOCS.find((d) => d.id === location.hash.replace('#', '')) ??
        LEGAL_DOCS[0]
    const activeDocId = doc.id

    /* آرایه‌ی تازه در هر رندر، افکتِ observer را بی‌جهت دوباره می‌سازد */
    const sectionIds = useMemo(
        () => doc.sections.map((s) => s.id),
        [doc]
    )
    const activeSectionId = useActiveSection(sectionIds)

    const scrollToSection = useCallback((id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    const switchDoc = (id) => {
        navigate(`#${id}`, { replace: true })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <TermsHero
                        title={doc.title}
                        subtitle={doc.subtitle}
                        intro={doc.intro}
                        updatedAt={doc.updatedAt}
                    />

                    {/* انتخاب سند — دو سند مستقل‌اند و بند ۱۷ قوانین هم
                        صریحاً به سند حریم خصوصی ارجاع می‌دهد. */}
                    <div className={styles.tabs} role="tablist" aria-label="اسناد حقوقی">
                        {LEGAL_DOCS.map((d) => (
                            <button
                                key={d.id}
                                type="button"
                                role="tab"
                                aria-selected={d.id === activeDocId}
                                className={`${styles.tab} ${
                                    d.id === activeDocId ? styles.tabActive : ''
                                }`}
                                onClick={() => switchDoc(d.id)}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.layout}>
                        <div className={styles.sections}>
                            {doc.sections.map((section) => (
                                <TermsSection key={section.id} section={section} />
                            ))}

                            {doc.callout && (
                                <aside className={styles.callout}>
                                    <h3 className={styles.calloutTitle}>
                                        {doc.callout.title}
                                    </h3>
                                    <p className={styles.calloutBody}>
                                        {doc.callout.body}
                                    </p>
                                </aside>
                            )}
                        </div>

                        <TermsToc
                            sections={doc.sections}
                            activeId={activeSectionId}
                            onSelect={scrollToSection}
                        />
                    </div>

                    <div className={styles.cta}>
                        <CtaBox
                            title="سؤالی درباره قوانین استفاده از NGCorion دارید؟"
                            description="تیم ما آماده پاسخ‌گویی به سؤالات مرتبط با License، استفاده از محصول و خدمات NGCorion است."
                            primaryLabel="تماس با ما"
                            primaryTo="/contact"
                        />
                    </div>

                    <section className={styles.related}>
                        <h2 className={styles.relatedTitle}>
                            <LinkIcon size={18} aria-hidden="true" />
                            لینک‌های مرتبط
                        </h2>

                        <div className={styles.chips}>
                            {RELATED_LINKS.map(({ icon: Icon, label, to, docId }) => {
                                const content = (
                                    <>
                                        <Icon size={20} aria-hidden="true" />
                                        {label}
                                    </>
                                )

                                if (docId) {
                                    return (
                                        <button
                                            key={label}
                                            type="button"
                                            className={styles.chip}
                                            onClick={() => switchDoc(docId)}
                                        >
                                            {content}
                                        </button>
                                    )
                                }

                                if (!to) {
                                    return (
                                        <span
                                            key={label}
                                            className={`${styles.chip} ${styles.chipSoon}`}
                                        >
                                            {content}
                                            <span className={styles.soon}>به‌زودی</span>
                                        </span>
                                    )
                                }

                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        className={styles.chip}
                                        onClick={() => navigate(to)}
                                    >
                                        {content}
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                </div>

                <Clients />
            </main>

            <Footer />
        </div>
    )
}
