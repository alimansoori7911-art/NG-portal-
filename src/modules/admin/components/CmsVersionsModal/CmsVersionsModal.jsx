import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, History, RotateCcw, Eye } from 'lucide-react'
import { cmsService } from '../../../../services/cmsService'
import { useCmsVersions } from '../../hooks/useCmsPages'
import styles from './CmsVersionsModal.module.css'

/**
 * تاریخچه‌ی نسخه‌های یک صفحه + پیش‌نمایش محتوای هر نسخه.
 *
 * ⚠️ اسپک مسیر «بازگردانی نسخه» ندارد. برگشت به نسخه‌ی قدیمی با
 * `PUT` و فرستادن محتوای همان نسخه انجام می‌شود؛ یعنی یک نسخه‌ی
 * **تازه** با محتوای قدیمی ساخته می‌شود و تاریخچه دست‌نخورده می‌ماند.
 * این رفتار درست‌تر از پاک کردن نسخه‌های بعدی است، ولی باید برای
 * کاربر صریح گفته شود — پس در متن دکمه و توضیح آمده.
 *
 * ⚠️ محتوای نسخه HTML خامی است که ادمین خودش نوشته. برای پیش‌نمایش
 * `dangerouslySetInnerHTML` لازم است؛ پاک‌سازی کار بک‌اند است.
 */
export default function CmsVersionsModal({ page, onClose, onRestored }) {
    const { rows, loading, error } = useCmsVersions(page?.id)

    /* نسخه‌ی باز‌شده برای پیش‌نمایش */
    const [openVersion, setOpenVersion] = useState(null)
    const [versionBody, setVersionBody] = useState(null)
    const [bodyLoading, setBodyLoading] = useState(false)
    const [bodyError, setBodyError] = useState(null)

    const [restoring, setRestoring] = useState(null)
    const [restoreError, setRestoreError] = useState(null)

    /* بستن با Escape و قفل اسکرول پشت — مثل ConfirmDialog */
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

    const showVersion = async (v) => {
        /* کلیک دوباره روی همان نسخه، پیش‌نمایش را می‌بندد */
        if (openVersion === v.version) {
            setOpenVersion(null)
            setVersionBody(null)
            return
        }

        setOpenVersion(v.version)
        setVersionBody(null)
        setBodyError(null)
        setBodyLoading(true)
        try {
            const data = await cmsService.getVersion(page.id, v.version)
            setVersionBody(data)
        } catch (err) {
            setBodyError(err?.message || 'دریافت محتوای نسخه ناموفق بود')
        } finally {
            setBodyLoading(false)
        }
    }

    const restore = async (v) => {
        setRestoring(v.version)
        setRestoreError(null)
        try {
            /* محتوای همان نسخه را می‌خوانیم و با PUT برمی‌گردانیم */
            const full = await cmsService.getVersion(page.id, v.version)
            await cmsService.updatePage(page.id, {
                title: full.title,
                excerpt: full.excerpt,
                content_raw: full.content_raw,
                content_format: full.content_format,
                is_public: full.is_public,
                robots: full.robots,
            })
            onRestored?.()
            onClose?.()
        } catch (err) {
            setRestoreError(err?.message || 'بازگردانی نسخه ناموفق بود')
        } finally {
            setRestoring(null)
        }
    }

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
                aria-label={`تاریخچه‌ی نسخه‌های ${page?.title ?? ''}`}
            >
                <header className={styles.header}>
                    <div className={styles.headTitle}>
                        <History size={18} aria-hidden="true" />
                        <div>
                            <h2 className={styles.title}>تاریخچه‌ی نسخه‌ها</h2>
                            <p className={styles.subtitle}>{page?.title}</p>
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
                    {error && (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    )}
                    {restoreError && (
                        <p className={styles.error} role="alert">
                            {restoreError}
                        </p>
                    )}

                    {loading ? (
                        <p className={styles.empty}>در حال دریافت…</p>
                    ) : rows.length === 0 ? (
                        <p className={styles.empty}>نسخه‌ای ثبت نشده است</p>
                    ) : (
                        <ul className={styles.list}>
                            {rows.map((v) => {
                                const isOpen = openVersion === v.version

                                return (
                                    <li key={v.id} className={styles.item}>
                                        <div className={styles.itemHead}>
                                            <div className={styles.itemMeta}>
                                                <span className={styles.version}>
                                                    نسخه‌ی{' '}
                                                    {v.version.toLocaleString('fa-IR')}
                                                </span>

                                                {v.is_current && (
                                                    <span
                                                        className={`${styles.tag} ${styles.tagCurrent}`}
                                                    >
                                                        نسخه‌ی جاری
                                                    </span>
                                                )}
                                                {v.is_published && (
                                                    <span
                                                        className={`${styles.tag} ${styles.tagPublished}`}
                                                    >
                                                        منتشرشده
                                                    </span>
                                                )}
                                            </div>

                                            <span className={styles.date} dir="ltr">
                                                {v.createdAtLabel}
                                            </span>
                                        </div>

                                        <p className={styles.itemTitle}>{v.title}</p>

                                        <div className={styles.itemActions}>
                                            <button
                                                type="button"
                                                className={styles.ghostBtn}
                                                onClick={() => showVersion(v)}
                                            >
                                                <Eye size={14} aria-hidden="true" />
                                                {isOpen ? 'بستن محتوا' : 'دیدن محتوا'}
                                            </button>

                                            {/* نسخه‌ی جاری را برگرداندن بی‌معناست */}
                                            {!v.is_current && (
                                                <button
                                                    type="button"
                                                    className={styles.ghostBtn}
                                                    onClick={() => restore(v)}
                                                    disabled={restoring != null}
                                                >
                                                    <RotateCcw
                                                        size={14}
                                                        aria-hidden="true"
                                                    />
                                                    {restoring === v.version
                                                        ? 'در حال بازگردانی…'
                                                        : 'بازگرداندن این نسخه'}
                                                </button>
                                            )}
                                        </div>

                                        {isOpen && (
                                            <div className={styles.preview}>
                                                {bodyLoading ? (
                                                    <p className={styles.empty}>
                                                        در حال دریافت…
                                                    </p>
                                                ) : bodyError ? (
                                                    <p
                                                        className={styles.error}
                                                        role="alert"
                                                    >
                                                        {bodyError}
                                                    </p>
                                                ) : (
                                                    /* HTML نوشته‌ی خود ادمین است؛
                                                       sanitize سمت سرور. */
                                                    <div
                                                        className={styles.html}
                                                        dir="rtl"
                                                        dangerouslySetInnerHTML={{
                                                            __html:
                                                                versionBody?.content_html ||
                                                                versionBody?.content_raw ||
                                                                '<p>این نسخه محتوایی ندارد.</p>',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                <footer className={styles.footer}>
                    بازگرداندن یک نسخه، نسخه‌های بعدی را پاک نمی‌کند؛ محتوای
                    قدیمی را در یک نسخه‌ی تازه می‌نشاند. برای دیده شدن روی سایت
                    بعد از بازگردانی، صفحه را دوباره منتشر کنید.
                </footer>
            </div>
        </div>,
        document.body
    )
}
