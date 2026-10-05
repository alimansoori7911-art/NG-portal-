import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import RichTextEditor from '../../../../components/ui/RichTextEditor/RichTextEditor'
import { PAGE_KIND, ROBOTS } from '../../../../services/cmsService'
import styles from './CmsPageForm.module.css'

/* اسلاگ در URL می‌نشیند، پس فقط لاتین و رقم و خط تیره می‌پذیریم.
   حرف فارسی در نشانی به درصد-کدگذاری تبدیل می‌شود
   (`/راهنما` → `/%D8%B1%D8%A7...`) که هم زشت است هم موقع
   اشتراک‌گذاری می‌شکند. */
const slugify = (s) =>
    String(s)
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

/**
 * ساخت و ویرایش صفحه‌ی محتوا.
 *
 * `page` که داده شود یعنی ویرایش؛ خالی یعنی ساخت.
 *
 * ⚠️ در حالت ویرایش `kind` غیرفعال است: `CmsPageUpdate` آن را نمی‌پذیرد
 * و تغییرش یعنی عوض شدن ساختار صفحه (مقاله در برابر ساختاریافته).
 *
 * ⚠️ صفحه‌ی **ساختاریافته** محتوای آزاد ندارد؛ بلوک‌هایش از
 * `structured-schemas` می‌آید. اینجا فقط ساختش پشتیبانی می‌شود و
 * ویرایش بلوک‌ها در تب «صفحه‌های ساختاریافته» انجام می‌شود، پس
 * ویرایشگر متن برای این نوع نمایش داده نمی‌شود.
 */
export default function CmsPageForm({
    page = null,
    busy = false,
    error = null,
    onSubmit,
    onClose,
}) {
    const editing = Boolean(page)

    const [form, setForm] = useState({
        kind: page?.kind ?? 'ARTICLE',
        title: page?.title ?? '',
        slug: page?.slug ?? '',
        excerpt: page?.excerpt ?? '',
        content_raw: page?.content_raw ?? '',
        is_public: page?.is_public ?? true,
        robots: page?.robots ?? 'INDEX',
        meta_title: page?.seo?.meta_title ?? '',
        meta_description: page?.seo?.meta_description ?? '',
        og_image_url: page?.seo?.og_image_url ?? '',
        canonical_url: page?.seo?.canonical_url ?? '',
        tags: (page?.tags ?? []).map((t) => t.name).join(', '),
    })
    /* اسلاگ تا وقتی دست‌کاری نشده از عنوان ساخته می‌شود؛ بعد از آن
       دیگر خودکار عوض نمی‌شود تا تغییر عنوان، نشانیِ منتشرشده را
       بی‌خبر نشکند. */
    const [slugTouched, setSlugTouched] = useState(editing)
    const [fieldErrors, setFieldErrors] = useState({})
    const [seoOpen, setSeoOpen] = useState(false)

    const clearError = (key) =>
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })

    const set = (key) => (e) => {
        const value =
            e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm((prev) => ({ ...prev, [key]: value }))
        clearError(key)
    }

    const onTitleChange = (e) => {
        const title = e.target.value
        setForm((prev) => ({
            ...prev,
            title,
            slug: slugTouched ? prev.slug : slugify(title),
        }))
        clearError('title')
    }

    const isArticle = form.kind === 'ARTICLE'

    const submit = (e) => {
        e.preventDefault()

        const errs = {}
        if (!form.title.trim()) errs.title = true
        /* اسلاگ اختیاری است (بک‌اند از عنوان می‌سازد) ولی اگر پر شد
           باید لاتین باشد، وگرنه نشانی درصد-کدگذاری‌شده می‌شود. */
        if (form.slug.trim() && slugify(form.slug) !== form.slug.trim()) {
            errs.slug = true
        }
        /* مقاله بدون متن بی‌معناست؛ صفحه‌ی ساختاریافته متن آزاد ندارد. */
        if (isArticle && !form.content_raw.trim()) errs.content_raw = true

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        const trimOrNull = (v) => (v.trim() ? v.trim() : null)

        const payload = {
            title: form.title.trim(),
            slug: trimOrNull(form.slug),
            excerpt: trimOrNull(form.excerpt),
            is_public: form.is_public,
            robots: form.robots,
            meta_title: trimOrNull(form.meta_title),
            meta_description: trimOrNull(form.meta_description),
            og_image_url: trimOrNull(form.og_image_url),
            canonical_url: trimOrNull(form.canonical_url),
            tags: form.tags
                .split(/[,،]+/)
                .map((t) => t.trim())
                .filter(Boolean),
        }

        if (isArticle) {
            payload.content_raw = form.content_raw
            /* ویرایشگر HTML می‌دهد — قالب باید با محتوا بخواند */
            payload.content_format = 'HTML'
        }

        /* `kind` فقط هنگام ساخت فرستاده می‌شود */
        if (!editing) payload.kind = form.kind

        onSubmit?.(payload)
    }

    return (
        <form className={styles.wrapper} onSubmit={submit} noValidate>
            <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="بستن فرم"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <div className={styles.divider} />

            <h2 className={styles.title}>
                {editing ? `ویرایش «${page.title}»` : 'ساخت صفحه‌ی محتوا'}
            </h2>

            <div className={styles.body}>
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <div className={styles.row}>
                    <label
                        className={`${styles.field} ${
                            fieldErrors.title ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>عنوان صفحه</span>
                        <input
                            className={styles.input}
                            value={form.title}
                            onChange={onTitleChange}
                            placeholder="درباره ما"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>
                            نوع صفحه {editing && '(قابل تغییر نیست)'}
                        </span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={form.kind}
                                onChange={set('kind')}
                                disabled={editing}
                            >
                                {Object.entries(PAGE_KIND).map(([v, l]) => (
                                    <option key={v} value={v}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                </div>

                <div className={styles.row}>
                    <label
                        className={`${styles.field} ${
                            fieldErrors.slug ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>
                            {fieldErrors.slug
                                ? 'نشانی فقط حروف لاتین، رقم و خط تیره'
                                : 'نشانی صفحه (خالی = از عنوان ساخته می‌شود)'}
                        </span>
                        <input
                            className={styles.input}
                            value={form.slug}
                            onChange={(e) => {
                                setSlugTouched(true)
                                set('slug')(e)
                            }}
                            placeholder="about-us"
                            dir="ltr"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>
                            برچسب‌ها (با کاما جدا کنید)
                        </span>
                        <input
                            className={styles.input}
                            value={form.tags}
                            onChange={set('tags')}
                            placeholder="شرکت، راهنما"
                        />
                    </label>
                </div>

                <label className={styles.field}>
                    <span className={styles.label}>
                        خلاصه (در فهرست مقاله‌ها نشان داده می‌شود)
                    </span>
                    <input
                        className={styles.input}
                        value={form.excerpt}
                        onChange={set('excerpt')}
                        placeholder="معرفی کوتاه شرکت و تیم"
                    />
                </label>

                {/* ── متن صفحه ── */}
                {isArticle ? (
                    <div className={styles.editorBlock}>
                        <span className={styles.editorLabel}>متن صفحه</span>
                        <RichTextEditor
                            value={form.content_raw}
                            onChange={(html) => {
                                setForm((prev) => ({ ...prev, content_raw: html }))
                                clearError('content_raw')
                            }}
                            error={Boolean(fieldErrors.content_raw)}
                            placeholder="متن صفحه را اینجا بنویسید…"
                        />
                        {fieldErrors.content_raw && (
                            <span className={styles.fieldHint}>
                                متن صفحه نمی‌تواند خالی باشد.
                            </span>
                        )}
                    </div>
                ) : (
                    <p className={styles.note}>
                        صفحه‌ی ساختاریافته متن آزاد ندارد؛ بلوک‌هایش بر اساس
                        قالبِ از پیش تعریف‌شده پر می‌شوند. بعد از ساخت، از تب
                        «صفحه‌های ساختاریافته» محتوای بلوک‌ها را ویرایش کنید.
                    </p>
                )}

                {/* ── انتشار ── */}
                <div className={styles.row}>
                    <div className={styles.checkBox}>
                        <label className={styles.checkRow}>
                            <input
                                type="checkbox"
                                checked={form.is_public}
                                onChange={set('is_public')}
                            />
                            <span>صفحه برای همه قابل دیدن باشد</span>
                        </label>
                    </div>

                    <label className={styles.field}>
                        <span className={styles.label}>دستور موتور جستجو</span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={form.robots}
                                onChange={set('robots')}
                            >
                                {Object.entries(ROBOTS).map(([v, l]) => (
                                    <option key={v} value={v}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                </div>

                {/* ── سئو — جمع‌شده چون اختیاری است و فرم را شلوغ می‌کند ── */}
                <button
                    type="button"
                    className={styles.seoToggle}
                    onClick={() => setSeoOpen((v) => !v)}
                    aria-expanded={seoOpen}
                >
                    <ChevronDown
                        size={16}
                        className={`${styles.seoChevron} ${
                            seoOpen ? styles.seoChevronOpen : ''
                        }`}
                    />
                    تنظیمات سئو (اختیاری)
                </button>

                {seoOpen && (
                    <>
                        <div className={styles.row}>
                            <label className={styles.field}>
                                <span className={styles.label}>
                                    عنوان سئو (خالی = عنوان صفحه)
                                </span>
                                <input
                                    className={styles.input}
                                    value={form.meta_title}
                                    onChange={set('meta_title')}
                                    placeholder="درباره ما | NGcorion"
                                />
                            </label>

                            <label className={styles.field}>
                                <span className={styles.label}>
                                    نشانی تصویر اشتراک‌گذاری
                                </span>
                                <input
                                    className={styles.input}
                                    value={form.og_image_url}
                                    onChange={set('og_image_url')}
                                    placeholder="https://example.com/og.png"
                                    dir="ltr"
                                />
                            </label>
                        </div>

                        <label className={styles.field}>
                            <span className={styles.label}>توضیح سئو</span>
                            <input
                                className={styles.input}
                                value={form.meta_description}
                                onChange={set('meta_description')}
                                placeholder="توضیح کوتاه برای نتایج جستجو"
                            />
                        </label>

                        <label className={styles.field}>
                            <span className={styles.label}>
                                نشانی اصلی (canonical)
                            </span>
                            <input
                                className={styles.input}
                                value={form.canonical_url}
                                onChange={set('canonical_url')}
                                placeholder="https://ngcorion.com/about-us"
                                dir="ltr"
                            />
                        </label>
                    </>
                )}

                <p className={styles.hint}>
                    ذخیره، صفحه را <strong>منتشر نمی‌کند</strong>؛ یک نسخه‌ی تازه
                    می‌سازد. برای دیده شدن روی سایت، از فهرست دکمه‌ی «انتشار» را
                    بزنید.
                </p>

                <div className={styles.actions}>
                    <button type="submit" className={styles.submit} disabled={busy}>
                        {busy
                            ? 'در حال ذخیره…'
                            : editing
                              ? 'ذخیره تغییرات'
                              : 'ساخت صفحه'}
                    </button>

                    <button
                        type="button"
                        className={styles.cancel}
                        onClick={onClose}
                        disabled={busy}
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </form>
    )
}
