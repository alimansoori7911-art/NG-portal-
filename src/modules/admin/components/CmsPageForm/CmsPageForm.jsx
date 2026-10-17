import { useEffect, useMemo, useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import RichTextEditor from '../../../../components/ui/RichTextEditor/RichTextEditor'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges'
import { PAGE_KIND, ROBOTS, toBlockInput } from '../../../../services/cmsService'
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

/* سقف‌های `CmsPageCreate`/`CmsPageUpdate` در اسپک. قبلاً در فرم
   کنترل نمی‌شدند و سرور فقط یک ۴۲۲ کلی برمی‌گرداند. */
const MAX = {
    title: 255,
    slug: 255,
    excerpt: 1000,
    meta_title: 255,
    meta_description: 500,
    og_image_url: 500,
    canonical_url: 500,
}
const MAX_TAGS = 20

const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(v.trim())

const splitTags = (v) =>
    v
        .split(/[,،]+/)
        .map((t) => t.trim())
        .filter(Boolean)

function Counter({ value, max }) {
    return (
        <span className={styles.counter}>
            {String(value ?? '').length.toLocaleString('fa-IR')}/
            {max.toLocaleString('fa-IR')}
        </span>
    )
}

/**
 * ساخت و ویرایش صفحه‌ی محتوا.
 *
 * `page` که داده شود یعنی ویرایش؛ خالی یعنی ساخت.
 *
 * ⚠️ در حالت ویرایش `kind` غیرفعال است: `CmsPageUpdate` آن را نمی‌پذیرد.
 *
 * ⚠️ صفحه‌ی **ساختاریافته** متن آزاد ندارد؛ بلوک‌هایش از قالب
 * (`schema_key`) می‌آید. ساختش بدون `schema_key` صفحه‌ای بی‌قالب
 * می‌ساخت که هیچ‌جا قابل ویرایش نبود، پس انتخاب قالب الزامی است.
 *
 * `schemas`: قالب‌های بک‌اند. `usedSchemaKeys`: قالب‌هایی که از قبل
 * صفحه دارند (هر قالب یک صفحه دارد). `onSubmit(payload, { publish })`.
 */
export default function CmsPageForm({
    page = null,
    busy = false,
    error = null,
    schemas = [],
    usedSchemaKeys = [],
    onSubmit,
    onClose,
    onDirtyChange,
}) {
    const editing = Boolean(page)

    const initialForm = useMemo(
        () => ({
            kind: page?.kind ?? 'ARTICLE',
            schema_key: page?.schema_key ?? '',
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
        }),
        [page]
    )
    const [form, setForm] = useState(initialForm)
    /* اسلاگ تا وقتی دست‌کاری نشده از عنوان ساخته می‌شود؛ بعد از آن
       دیگر خودکار عوض نمی‌شود تا تغییر عنوان، نشانیِ منتشرشده را
       بی‌خبر نشکند. */
    const [slugTouched, setSlugTouched] = useState(editing)
    const [fieldErrors, setFieldErrors] = useState({})
    const [seoOpen, setSeoOpen] = useState(false)
    const [confirmClose, setConfirmClose] = useState(false)

    const dirty = JSON.stringify(form) !== JSON.stringify(initialForm)
    useUnsavedChanges(dirty)
    useEffect(() => {
        onDirtyChange?.(dirty)
    }, [dirty, onDirtyChange])

    const freeSchemas = schemas.filter((s) => !usedSchemaKeys.includes(s.key))

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
    const isStructured = form.kind === 'STRUCTURED'

    /* تغییر نشانی صفحه‌ای که روی سایت است: لینک‌های قدیمی به‌کمک
       ریدایرکت سرور کار می‌کنند، ولی ادمین باید بداند. */
    const slugChangedLive =
        editing &&
        page?.status === 'PUBLISHED' &&
        form.slug.trim() !== (page?.slug ?? '')

    const submit = (publish) => {
        const errs = {}
        if (!form.title.trim()) errs.title = 'عنوان صفحه را بنویسید'
        /* اسلاگ اختیاری است (بک‌اند از عنوان می‌سازد) ولی اگر پر شد
           باید لاتین باشد، وگرنه نشانی درصد-کدگذاری‌شده می‌شود. */
        if (form.slug.trim() && slugify(form.slug) !== form.slug.trim()) {
            errs.slug = `نشانی فقط حروف کوچک لاتین، رقم و خط تیره؛ مثلاً «${
                slugify(form.slug) || 'about-us'
            }»`
        }
        /* مقاله بدون متن بی‌معناست؛ صفحه‌ی ساختاریافته متن آزاد ندارد. */
        if (isArticle && !form.content_raw.replace(/<[^>]*>/g, '').trim()) {
            errs.content_raw = 'متن صفحه نمی‌تواند خالی باشد'
        }
        if (!editing && isStructured && !form.schema_key) {
            errs.schema_key = 'قالب صفحه را انتخاب کنید'
        }
        if (splitTags(form.tags).length > MAX_TAGS) {
            errs.tags = `حداکثر ${MAX_TAGS.toLocaleString('fa-IR')} برچسب`
        }
        for (const k of ['og_image_url', 'canonical_url']) {
            if (form[k].trim() && !isHttpUrl(form[k])) {
                errs[k] = 'نشانی کامل با https:// بنویسید'
                setSeoOpen(true)
            }
        }

        setFieldErrors(errs)
        if (Object.keys(errs).length > 0) return

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
            tags: splitTags(form.tags),
        }

        if (isArticle) {
            payload.content_raw = form.content_raw
            /* ویرایشگر HTML می‌دهد — قالب باید با محتوا بخواند */
            payload.content_format = 'HTML'
        }

        if (!editing) {
            payload.kind = form.kind
            if (isStructured) payload.schema_key = form.schema_key
        } else if (isStructured && page?.blocks?.length) {
            payload.blocks = toBlockInput(page.blocks)
        }

        onSubmit?.(payload, { publish })
    }

    const requestClose = () => {
        if (dirty) setConfirmClose(true)
        else onClose?.()
    }

    /* انتشار مستقیم فقط اگر اجازه‌اش هست؛ صفحه‌ی تازه هنوز پرچم
       دسترسی ندارد و اگر اجازه نباشد سرور خطای روشن می‌دهد. */
    const canPublish = editing ? Boolean(page?.permissions?.can_publish) : true

    const errorBox = error && (
        <p className={styles.error} role="alert">
            {error}
        </p>
    )

    const fieldClass = (key) =>
        `${styles.field} ${fieldErrors[key] ? styles.fieldError : ''}`

    const errorOf = (key) =>
        fieldErrors[key] && <span className={styles.fieldHint}>{fieldErrors[key]}</span>

    return (
        <form
            className={styles.wrapper}
            onSubmit={(e) => {
                e.preventDefault()
                submit(false)
            }}
            noValidate
        >
            <button
                type="button"
                className={styles.close}
                onClick={requestClose}
                aria-label="بستن فرم"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <div className={styles.divider} />

            <h2 className={styles.title}>
                {editing ? `ویرایش «${page.title}»` : 'ساخت صفحه‌ی محتوا'}
            </h2>

            <div className={styles.body}>
                {errorBox}

                <div className={styles.row}>
                    <label className={fieldClass('title')}>
                        <span className={styles.label}>
                            عنوان صفحه
                            <Counter value={form.title} max={MAX.title} />
                        </span>
                        <input
                            className={styles.input}
                            value={form.title}
                            onChange={onTitleChange}
                            maxLength={MAX.title}
                            placeholder="درباره ما"
                        />
                        {errorOf('title')}
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
                                    <option
                                        key={v}
                                        value={v}
                                        disabled={
                                            !editing &&
                                            v === 'STRUCTURED' &&
                                            freeSchemas.length === 0
                                        }
                                    >
                                        {l}
                                        {!editing &&
                                            v === 'STRUCTURED' &&
                                            freeSchemas.length === 0 &&
                                            ' (همه‌ی قالب‌ها صفحه دارند)'}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                </div>

                {!editing && isStructured && (
                    <label className={fieldClass('schema_key')}>
                        <span className={styles.label}>قالب صفحه</span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={form.schema_key}
                                onChange={set('schema_key')}
                            >
                                <option value="">یک قالب انتخاب کنید…</option>
                                {freeSchemas.map((s) => (
                                    <option key={s.key} value={s.key}>
                                        {s.title || s.key}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                        {errorOf('schema_key')}
                    </label>
                )}

                <div className={styles.row}>
                    <label className={fieldClass('slug')}>
                        <span className={styles.label}>
                            نشانی صفحه (خالی = از عنوان ساخته می‌شود)
                            <Counter value={form.slug} max={MAX.slug} />
                        </span>
                        <input
                            className={styles.input}
                            value={form.slug}
                            onChange={(e) => {
                                setSlugTouched(true)
                                set('slug')(e)
                            }}
                            /* حروف بزرگ و فاصله همان لحظه درست می‌شوند، نه
                               این‌که فقط موقع ذخیره خطا بدهند */
                            onBlur={() =>
                                form.slug.trim() &&
                                setForm((prev) => ({ ...prev, slug: slugify(prev.slug) }))
                            }
                            maxLength={MAX.slug}
                            placeholder="about-us"
                            dir="ltr"
                        />
                        {errorOf('slug')}
                        {slugChangedLive && !fieldErrors.slug && (
                            <span className={styles.warnHint}>
                                این صفحه منتشر شده است. با تغییر نشانی، لینک‌های قبلی
                                به نشانی تازه ریدایرکت می‌شوند (تب «ریدایرکت‌ها»)،
                                ولی لینک‌هایی که جای دیگری گذاشته‌اید را به‌روز کنید.
                            </span>
                        )}
                    </label>

                    <label className={fieldClass('tags')}>
                        <span className={styles.label}>
                            برچسب‌ها (با کاما جدا کنید، حداکثر{' '}
                            {MAX_TAGS.toLocaleString('fa-IR')})
                        </span>
                        <input
                            className={styles.input}
                            value={form.tags}
                            onChange={set('tags')}
                            placeholder="شرکت، راهنما"
                        />
                        {errorOf('tags')}
                    </label>
                </div>

                <label className={styles.field}>
                    <span className={styles.label}>
                        خلاصه (در فهرست مقاله‌ها نشان داده می‌شود)
                        <Counter value={form.excerpt} max={MAX.excerpt} />
                    </span>
                    <input
                        className={styles.input}
                        value={form.excerpt}
                        onChange={set('excerpt')}
                        maxLength={MAX.excerpt}
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
                        {errorOf('content_raw')}
                    </div>
                ) : (
                    <p className={styles.note}>
                        صفحه‌ی ساختاریافته متن آزاد ندارد؛ بلوک‌هایش بر اساس
                        قالبِ از پیش تعریف‌شده پر می‌شوند.{' '}
                        {editing
                            ? 'اینجا فقط عنوان، دسترسی و سئو را عوض می‌کنید؛ محتوای بلوک‌ها از تب «صفحه‌های ساختاریافته» و دکمه‌ی «ویرایش بلوک‌ها» ویرایش می‌شود.'
                            : 'بعد از ساخت، از تب «صفحه‌های ساختاریافته» محتوای بلوک‌ها را ویرایش کنید.'}
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
                        {!form.is_public && (
                            <span className={styles.warnHint}>
                                صفحه‌ی خصوصی حتی بعد از انتشار روی سایت دیده نمی‌شود.
                            </span>
                        )}
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
                                    <Counter value={form.meta_title} max={MAX.meta_title} />
                                </span>
                                <input
                                    className={styles.input}
                                    value={form.meta_title}
                                    onChange={set('meta_title')}
                                    maxLength={MAX.meta_title}
                                    placeholder="درباره ما | NGcorion"
                                />
                            </label>

                            <label className={fieldClass('og_image_url')}>
                                <span className={styles.label}>
                                    نشانی تصویر اشتراک‌گذاری
                                </span>
                                <input
                                    className={styles.input}
                                    value={form.og_image_url}
                                    onChange={set('og_image_url')}
                                    maxLength={MAX.og_image_url}
                                    placeholder="https://example.com/og.png"
                                    dir="ltr"
                                />
                                {errorOf('og_image_url')}
                            </label>
                        </div>

                        <label className={styles.field}>
                            <span className={styles.label}>
                                توضیح سئو
                                <Counter
                                    value={form.meta_description}
                                    max={MAX.meta_description}
                                />
                            </span>
                            <input
                                className={styles.input}
                                value={form.meta_description}
                                onChange={set('meta_description')}
                                maxLength={MAX.meta_description}
                                placeholder="توضیح کوتاه برای نتایج جستجو"
                            />
                        </label>

                        <label className={fieldClass('canonical_url')}>
                            <span className={styles.label}>
                                نشانی اصلی (canonical)
                            </span>
                            <input
                                className={styles.input}
                                value={form.canonical_url}
                                onChange={set('canonical_url')}
                                maxLength={MAX.canonical_url}
                                placeholder="https://ngcorion.com/about-us"
                                dir="ltr"
                            />
                            {errorOf('canonical_url')}
                        </label>
                    </>
                )}

                <p className={styles.hint}>
                    «ذخیره» فقط یک نسخه‌ی تازه می‌سازد و روی سایت دیده نمی‌شود.
                    برای دیده شدن، «ذخیره و انتشار» را بزنید.
                </p>

                {/* خطا کنار دکمه‌ها هم تکرار می‌شود؛ ادمین بعد از کلیک
                    پایین فرم است و پیام بالای صفحه را نمی‌بیند. */}
                {Object.keys(fieldErrors).length > 0 && (
                    <p className={styles.error} role="alert">
                        چند فیلد نیاز به اصلاح دارد؛ کنار هر کدام توضیح داده شده.
                    </p>
                )}
                {errorBox}

                <div className={styles.actions}>
                    {canPublish && (
                        <button
                            type="button"
                            className={styles.submit}
                            disabled={busy}
                            onClick={() => submit(true)}
                        >
                            {busy
                                ? 'در حال ذخیره…'
                                : editing
                                  ? 'ذخیره و انتشار'
                                  : 'ساخت و انتشار'}
                        </button>
                    )}

                    <button
                        type="submit"
                        className={canPublish ? styles.cancel : styles.submit}
                        disabled={busy}
                    >
                        {busy
                            ? 'در حال ذخیره…'
                            : editing
                              ? 'فقط ذخیره'
                              : 'ساخت (پیش‌نویس)'}
                    </button>

                    <button
                        type="button"
                        className={styles.cancel}
                        onClick={requestClose}
                        disabled={busy}
                    >
                        انصراف
                    </button>
                </div>
            </div>

            <ConfirmDialog
                open={confirmClose}
                title="تغییرات ذخیره نشده"
                message="تغییراتی که داده‌اید ذخیره نشده‌اند و با بستن فرم از بین می‌روند. خارج می‌شوید؟"
                confirmLabel="خروج بدون ذخیره"
                cancelLabel="ادامه‌ی ویرایش"
                onConfirm={() => {
                    setConfirmClose(false)
                    onClose?.()
                }}
                onClose={() => setConfirmClose(false)}
            />
        </form>
    )
}
