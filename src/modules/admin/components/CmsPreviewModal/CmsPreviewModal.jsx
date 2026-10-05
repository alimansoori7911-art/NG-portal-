import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye } from 'lucide-react'
import { cmsService, pageState } from '../../../../services/cmsService'
import styles from './CmsPreviewModal.module.css'

/**
 * پیش‌نمایش صفحه — نسخه‌ی جاری، همان‌طور که روی سایت دیده می‌شود.
 *
 * ⚠️ این پیش‌نمایش **نسخه‌ی جاری** را نشان می‌دهد نه منتشرشده را؛
 * یعنی اگر صفحه تغییر ذخیره‌نشده داشته باشد، چیزی که اینجا می‌بینید
 * با سایت فرق دارد. برچسبش بالای محتوا صریح گفته شده.
 *
 * ⚠️ `dangerouslySetInnerHTML` لازم است چون محتوا HTML است. پاک‌سازی
 * کار بک‌اند است — نه اینجا.
 */
export default function CmsPreviewModal({ page, onClose }) {
    /* نتیجه با شناسه نگه داشته می‌شود تا صفر کردن state داخل افکت
       لازم نشود؛ `loading` از نبودِ نتیجه‌ی تازه درمی‌آید. */
    const [result, setResult] = useState({ id: null, data: null, error: null })

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = prev
        }
    }, [onClose])

    useEffect(() => {
        if (!page?.id) return

        let cancelled = false
        const id = page.id

        cmsService
            .previewPage(id)
            .then((d) => {
                if (!cancelled) setResult({ id, data: d, error: null })
            })
            .catch((err) => {
                if (!cancelled) {
                    setResult({
                        id,
                        data: null,
                        error: err?.message || 'دریافت پیش‌نمایش ناموفق بود',
                    })
                }
            })

        return () => {
            cancelled = true
        }
    }, [page?.id])

    /* نتیجه‌ی مربوط به صفحه‌ی دیگری، نتیجه‌ی این یکی نیست */
    const fresh = result.id === page?.id
    const data = fresh ? result.data : null
    const error = fresh ? result.error : null
    const loading = Boolean(page?.id) && !fresh

    const state = data ? pageState(data) : null
    const html = data?.content_html || data?.content_raw || ''
    const blocks = data?.blocks ?? []

    return createPortal(
        <div
            className={styles.overlay}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.()
            }}
        >
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-label={`پیش‌نمایش ${page?.title ?? ''}`}
            >
                <header className={styles.header}>
                    <div className={styles.headTitle}>
                        <Eye size={18} aria-hidden="true" />
                        <div>
                            <h2 className={styles.title}>پیش‌نمایش صفحه</h2>
                            <p className={styles.subtitle} dir="ltr">
                                /{data?.slug ?? page?.slug}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={styles.close}
                        onClick={onClose}
                        aria-label="بستن"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>
                </header>

                <div className={styles.scroll}>
                    {loading ? (
                        <p className={styles.empty}>در حال دریافت…</p>
                    ) : error ? (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    ) : (
                        <>
                            {/* هشدار اختلاف با سایت — فقط وقتی واقعاً هست */}
                            {data?.has_unpublished_changes && (
                                <p className={styles.warn}>
                                    این پیش‌نمایش نسخه‌ی{' '}
                                    {Number(data.version).toLocaleString('fa-IR')} است
                                    که هنوز منتشر نشده؛ چیزی که روی سایت دیده می‌شود
                                    با این فرق دارد.
                                </p>
                            )}

                            <div className={styles.meta}>
                                {state && (
                                    <span
                                        className={`${styles.badge} ${
                                            styles['badge_' + state.key]
                                        }`}
                                    >
                                        {state.label}
                                    </span>
                                )}
                                <span className={styles.metaItem}>
                                    نسخه‌ی{' '}
                                    {Number(data?.version ?? 1).toLocaleString('fa-IR')}
                                </span>
                                <span className={styles.metaItem}>
                                    {data?.is_public ? 'عمومی' : 'خصوصی'}
                                </span>
                            </div>

                            <h1 className={styles.pageTitle}>{data?.title}</h1>

                            {data?.excerpt && (
                                <p className={styles.excerpt}>{data.excerpt}</p>
                            )}

                            {/* صفحه‌ی ساختاریافته محتوای آزاد ندارد؛
                                بلوک‌هایش را خام نشان می‌دهیم چون قالب
                                نمایششان سمت سایت عمومی است نه پنل. */}
                            {blocks.length > 0 ? (
                                <div className={styles.blocks}>
                                    {blocks.map((b) => (
                                        <div key={b.key} className={styles.block}>
                                            <span className={styles.blockKey} dir="ltr">
                                                {b.key} · {b.type}
                                            </span>

                                            <dl className={styles.fields}>
                                                {Object.entries(b.fields ?? {}).map(
                                                    ([k, v]) => (
                                                        <div
                                                            key={k}
                                                            className={styles.fieldRow}
                                                        >
                                                            <dt
                                                                className={
                                                                    styles.fieldKey
                                                                }
                                                                dir="ltr"
                                                            >
                                                                {k}
                                                            </dt>
                                                            <dd
                                                                className={
                                                                    styles.fieldValue
                                                                }
                                                            >
                                                                {typeof v === 'string'
                                                                    ? v
                                                                    : JSON.stringify(v)}
                                                            </dd>
                                                        </div>
                                                    )
                                                )}
                                            </dl>
                                        </div>
                                    ))}
                                </div>
                            ) : html ? (
                                <div
                                    className={styles.html}
                                    dir="rtl"
                                    dangerouslySetInnerHTML={{ __html: html }}
                                />
                            ) : (
                                <p className={styles.empty}>
                                    این صفحه هنوز محتوایی ندارد.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}
